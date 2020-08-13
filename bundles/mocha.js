import path from 'path';
import util from 'util';
import os from 'os';
import tty from 'tty';
import events from 'events';
import fs from 'fs';
import child_process from 'child_process';
import url from 'url';
import crypto from 'crypto';

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

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

var escapeStringRegexp = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

function Diff() {}
Diff.prototype = {
  diff: function diff(oldString, newString) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var callback = options.callback;

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    this.options = options;
    var self = this;

    function done(value) {
      if (callback) {
        setTimeout(function () {
          callback(undefined, value);
        }, 0);
        return true;
      } else {
        return value;
      }
    } // Allow subclasses to massage the input prior to running


    oldString = this.castInput(oldString);
    newString = this.castInput(newString);
    oldString = this.removeEmpty(this.tokenize(oldString));
    newString = this.removeEmpty(this.tokenize(newString));
    var newLen = newString.length,
        oldLen = oldString.length;
    var editLength = 1;
    var maxEditLength = newLen + oldLen;
    var bestPath = [{
      newPos: -1,
      components: []
    }]; // Seed editLength = 0, i.e. the content starts with the same values

    var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);

    if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
      // Identity per the equality and tokenizer
      return done([{
        value: this.join(newString),
        count: newString.length
      }]);
    } // Main worker method. checks all permutations of a given edit length for acceptance.


    function execEditLength() {
      for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
        var basePath = void 0;

        var addPath = bestPath[diagonalPath - 1],
            removePath = bestPath[diagonalPath + 1],
            _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;

        if (addPath) {
          // No one else is going to attempt to use this value, clear it
          bestPath[diagonalPath - 1] = undefined;
        }

        var canAdd = addPath && addPath.newPos + 1 < newLen,
            canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;

        if (!canAdd && !canRemove) {
          // If this path is a terminal then prune
          bestPath[diagonalPath] = undefined;
          continue;
        } // Select the diagonal that we want to branch from. We select the prior
        // path whose position in the new string is the farthest from the origin
        // and does not pass the bounds of the diff graph


        if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
          basePath = clonePath(removePath);
          self.pushComponent(basePath.components, undefined, true);
        } else {
          basePath = addPath; // No need to clone, we've pulled it from the list

          basePath.newPos++;
          self.pushComponent(basePath.components, true, undefined);
        }

        _oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath); // If we have hit the end of both strings, then we are done

        if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
          return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
        } else {
          // Otherwise track this path as a potential candidate and continue.
          bestPath[diagonalPath] = basePath;
        }
      }

      editLength++;
    } // Performs the length of edit iteration. Is a bit fugly as this has to support the
    // sync and async mode which is never fun. Loops over execEditLength until a value
    // is produced.


    if (callback) {
      (function exec() {
        setTimeout(function () {
          // This should not happen, but we want to be safe.

          /* istanbul ignore next */
          if (editLength > maxEditLength) {
            return callback();
          }

          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength) {
        var ret = execEditLength();

        if (ret) {
          return ret;
        }
      }
    }
  },
  pushComponent: function pushComponent(components, added, removed) {
    var last = components[components.length - 1];

    if (last && last.added === added && last.removed === removed) {
      // We need to clone here as the component clone operation is just
      // as shallow array clone
      components[components.length - 1] = {
        count: last.count + 1,
        added: added,
        removed: removed
      };
    } else {
      components.push({
        count: 1,
        added: added,
        removed: removed
      });
    }
  },
  extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
    var newLen = newString.length,
        oldLen = oldString.length,
        newPos = basePath.newPos,
        oldPos = newPos - diagonalPath,
        commonCount = 0;

    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
      newPos++;
      oldPos++;
      commonCount++;
    }

    if (commonCount) {
      basePath.components.push({
        count: commonCount
      });
    }

    basePath.newPos = newPos;
    return oldPos;
  },
  equals: function equals(left, right) {
    if (this.options.comparator) {
      return this.options.comparator(left, right);
    } else {
      return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
    }
  },
  removeEmpty: function removeEmpty(array) {
    var ret = [];

    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }

    return ret;
  },
  castInput: function castInput(value) {
    return value;
  },
  tokenize: function tokenize(value) {
    return value.split('');
  },
  join: function join(chars) {
    return chars.join('');
  }
};

function buildValues(diff, components, newString, oldString, useLongestToken) {
  var componentPos = 0,
      componentLen = components.length,
      newPos = 0,
      oldPos = 0;

  for (; componentPos < componentLen; componentPos++) {
    var component = components[componentPos];

    if (!component.removed) {
      if (!component.added && useLongestToken) {
        var value = newString.slice(newPos, newPos + component.count);
        value = value.map(function (value, i) {
          var oldValue = oldString[oldPos + i];
          return oldValue.length > value.length ? oldValue : value;
        });
        component.value = diff.join(value);
      } else {
        component.value = diff.join(newString.slice(newPos, newPos + component.count));
      }

      newPos += component.count; // Common case

      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
      oldPos += component.count; // Reverse add and remove so removes are output first to match common convention
      // The diffing algorithm is tied to add then remove output and this is the simplest
      // route to get the desired output with minimal overhead.

      if (componentPos && components[componentPos - 1].added) {
        var tmp = components[componentPos - 1];
        components[componentPos - 1] = components[componentPos];
        components[componentPos] = tmp;
      }
    }
  } // Special case handle for when one terminal is ignored (i.e. whitespace).
  // For this case we merge the terminal into the prior string and drop the change.
  // This is only available for string mode.


  var lastComponent = components[componentLen - 1];

  if (componentLen > 1 && typeof lastComponent.value === 'string' && (lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
    components[componentLen - 2].value += lastComponent.value;
    components.pop();
  }

  return components;
}

function clonePath(path) {
  return {
    newPos: path.newPos,
    components: path.components.slice(0)
  };
}

var characterDiff = new Diff();
function diffChars(oldStr, newStr, options) {
  return characterDiff.diff(oldStr, newStr, options);
}

function generateOptions(options, defaults) {
  if (typeof options === 'function') {
    defaults.callback = options;
  } else if (options) {
    for (var name in options) {
      /* istanbul ignore else */
      if (options.hasOwnProperty(name)) {
        defaults[name] = options[name];
      }
    }
  }

  return defaults;
}

//
// Ranges and exceptions:
// Latin-1 Supplement, 0080–00FF
//  - U+00D7  × Multiplication sign
//  - U+00F7  ÷ Division sign
// Latin Extended-A, 0100–017F
// Latin Extended-B, 0180–024F
// IPA Extensions, 0250–02AF
// Spacing Modifier Letters, 02B0–02FF
//  - U+02C7  ˇ &#711;  Caron
//  - U+02D8  ˘ &#728;  Breve
//  - U+02D9  ˙ &#729;  Dot Above
//  - U+02DA  ˚ &#730;  Ring Above
//  - U+02DB  ˛ &#731;  Ogonek
//  - U+02DC  ˜ &#732;  Small Tilde
//  - U+02DD  ˝ &#733;  Double Acute Accent
// Latin Extended Additional, 1E00–1EFF

var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
var reWhitespace = /\S/;
var wordDiff = new Diff();

wordDiff.equals = function (left, right) {
  if (this.options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }

  return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
};

wordDiff.tokenize = function (value) {
  var tokens = value.split(/(\s+|[()[\]{}'"]|\b)/); // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.

  for (var i = 0; i < tokens.length - 1; i++) {
    // If we have an empty string in the next field and we have only word chars before and after, merge
    if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }

  return tokens;
};

function diffWords(oldStr, newStr, options) {
  options = generateOptions(options, {
    ignoreWhitespace: true
  });
  return wordDiff.diff(oldStr, newStr, options);
}
function diffWordsWithSpace(oldStr, newStr, options) {
  return wordDiff.diff(oldStr, newStr, options);
}

var lineDiff = new Diff();

lineDiff.tokenize = function (value) {
  var retLines = [],
      linesAndNewlines = value.split(/(\n|\r\n)/); // Ignore the final empty token that occurs if the string ends with a new line

  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  } // Merge the content and line separators into single tokens


  for (var i = 0; i < linesAndNewlines.length; i++) {
    var line = linesAndNewlines[i];

    if (i % 2 && !this.options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      if (this.options.ignoreWhitespace) {
        line = line.trim();
      }

      retLines.push(line);
    }
  }

  return retLines;
};

function diffLines(oldStr, newStr, callback) {
  return lineDiff.diff(oldStr, newStr, callback);
}
function diffTrimmedLines(oldStr, newStr, callback) {
  var options = generateOptions(callback, {
    ignoreWhitespace: true
  });
  return lineDiff.diff(oldStr, newStr, options);
}

var sentenceDiff = new Diff();

sentenceDiff.tokenize = function (value) {
  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
};

function diffSentences(oldStr, newStr, callback) {
  return sentenceDiff.diff(oldStr, newStr, callback);
}

var cssDiff = new Diff();

cssDiff.tokenize = function (value) {
  return value.split(/([{}:;,]|\s+)/);
};

function diffCss(oldStr, newStr, callback) {
  return cssDiff.diff(oldStr, newStr, callback);
}

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

var objectPrototypeToString = Object.prototype.toString;
var jsonDiff = new Diff(); // Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
// dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:

jsonDiff.useLongestToken = true;
jsonDiff.tokenize = lineDiff.tokenize;

jsonDiff.castInput = function (value) {
  var _this$options = this.options,
      undefinedReplacement = _this$options.undefinedReplacement,
      _this$options$stringi = _this$options.stringifyReplacer,
      stringifyReplacer = _this$options$stringi === void 0 ? function (k, v) {
    return typeof v === 'undefined' ? undefinedReplacement : v;
  } : _this$options$stringi;
  return typeof value === 'string' ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, '  ');
};

jsonDiff.equals = function (left, right) {
  return Diff.prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'));
};

function diffJson(oldObj, newObj, options) {
  return jsonDiff.diff(oldObj, newObj, options);
} // This function handles the presence of circular references by bailing out when encountering an
// object that is already on the "stack" of items being processed. Accepts an optional replacer

function canonicalize(obj, stack, replacementStack, replacer, key) {
  stack = stack || [];
  replacementStack = replacementStack || [];

  if (replacer) {
    obj = replacer(key, obj);
  }

  var i;

  for (i = 0; i < stack.length; i += 1) {
    if (stack[i] === obj) {
      return replacementStack[i];
    }
  }

  var canonicalizedObj;

  if ('[object Array]' === objectPrototypeToString.call(obj)) {
    stack.push(obj);
    canonicalizedObj = new Array(obj.length);
    replacementStack.push(canonicalizedObj);

    for (i = 0; i < obj.length; i += 1) {
      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, key);
    }

    stack.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }

  if (obj && obj.toJSON) {
    obj = obj.toJSON();
  }

  if (_typeof(obj) === 'object' && obj !== null) {
    stack.push(obj);
    canonicalizedObj = {};
    replacementStack.push(canonicalizedObj);

    var sortedKeys = [],
        _key;

    for (_key in obj) {
      /* istanbul ignore else */
      if (obj.hasOwnProperty(_key)) {
        sortedKeys.push(_key);
      }
    }

    sortedKeys.sort();

    for (i = 0; i < sortedKeys.length; i += 1) {
      _key = sortedKeys[i];
      canonicalizedObj[_key] = canonicalize(obj[_key], stack, replacementStack, replacer, _key);
    }

    stack.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }

  return canonicalizedObj;
}

var arrayDiff = new Diff();

arrayDiff.tokenize = function (value) {
  return value.slice();
};

arrayDiff.join = arrayDiff.removeEmpty = function (value) {
  return value;
};

function diffArrays(oldArr, newArr, callback) {
  return arrayDiff.diff(oldArr, newArr, callback);
}

function parsePatch(uniDiff) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var diffstr = uniDiff.split(/\r\n|[\n\v\f\r\x85]/),
      delimiters = uniDiff.match(/\r\n|[\n\v\f\r\x85]/g) || [],
      list = [],
      i = 0;

  function parseIndex() {
    var index = {};
    list.push(index); // Parse diff metadata

    while (i < diffstr.length) {
      var line = diffstr[i]; // File header found, end parsing diff metadata

      if (/^(\-\-\-|\+\+\+|@@)\s/.test(line)) {
        break;
      } // Diff index


      var header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);

      if (header) {
        index.index = header[1];
      }

      i++;
    } // Parse file headers if they are defined. Unified diff requires them, but
    // there's no technical issues to have an isolated hunk without file header


    parseFileHeader(index);
    parseFileHeader(index); // Parse hunks

    index.hunks = [];

    while (i < diffstr.length) {
      var _line = diffstr[i];

      if (/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(_line)) {
        break;
      } else if (/^@@/.test(_line)) {
        index.hunks.push(parseHunk());
      } else if (_line && options.strict) {
        // Ignore unexpected content unless in strict mode
        throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(_line));
      } else {
        i++;
      }
    }
  } // Parses the --- and +++ headers, if none are found, no lines
  // are consumed.


  function parseFileHeader(index) {
    var fileHeader = /^(---|\+\+\+)\s+(.*)$/.exec(diffstr[i]);

    if (fileHeader) {
      var keyPrefix = fileHeader[1] === '---' ? 'old' : 'new';
      var data = fileHeader[2].split('\t', 2);
      var fileName = data[0].replace(/\\\\/g, '\\');

      if (/^".*"$/.test(fileName)) {
        fileName = fileName.substr(1, fileName.length - 2);
      }

      index[keyPrefix + 'FileName'] = fileName;
      index[keyPrefix + 'Header'] = (data[1] || '').trim();
      i++;
    }
  } // Parses a hunk
  // This assumes that we are at the start of a hunk.


  function parseHunk() {
    var chunkHeaderIndex = i,
        chunkHeaderLine = diffstr[i++],
        chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    var hunk = {
      oldStart: +chunkHeader[1],
      oldLines: +chunkHeader[2] || 1,
      newStart: +chunkHeader[3],
      newLines: +chunkHeader[4] || 1,
      lines: [],
      linedelimiters: []
    };
    var addCount = 0,
        removeCount = 0;

    for (; i < diffstr.length; i++) {
      // Lines starting with '---' could be mistaken for the "remove line" operation
      // But they could be the header for the next file. Therefore prune such cases out.
      if (diffstr[i].indexOf('--- ') === 0 && i + 2 < diffstr.length && diffstr[i + 1].indexOf('+++ ') === 0 && diffstr[i + 2].indexOf('@@') === 0) {
        break;
      }

      var operation = diffstr[i].length == 0 && i != diffstr.length - 1 ? ' ' : diffstr[i][0];

      if (operation === '+' || operation === '-' || operation === ' ' || operation === '\\') {
        hunk.lines.push(diffstr[i]);
        hunk.linedelimiters.push(delimiters[i] || '\n');

        if (operation === '+') {
          addCount++;
        } else if (operation === '-') {
          removeCount++;
        } else if (operation === ' ') {
          addCount++;
          removeCount++;
        }
      } else {
        break;
      }
    } // Handle the empty block count case


    if (!addCount && hunk.newLines === 1) {
      hunk.newLines = 0;
    }

    if (!removeCount && hunk.oldLines === 1) {
      hunk.oldLines = 0;
    } // Perform optional sanity checking


    if (options.strict) {
      if (addCount !== hunk.newLines) {
        throw new Error('Added line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }

      if (removeCount !== hunk.oldLines) {
        throw new Error('Removed line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }
    }

    return hunk;
  }

  while (i < diffstr.length) {
    parseIndex();
  }

  return list;
}

// Iterator that traverses in the range of [min, max], stepping
// by distance from a given start position. I.e. for [0, 4], with
// start of 2, this will iterate 2, 3, 1, 4, 0.
function distanceIterator (start, minLine, maxLine) {
  var wantForward = true,
      backwardExhausted = false,
      forwardExhausted = false,
      localOffset = 1;
  return function iterator() {
    if (wantForward && !forwardExhausted) {
      if (backwardExhausted) {
        localOffset++;
      } else {
        wantForward = false;
      } // Check if trying to fit beyond text length, and if not, check it fits
      // after offset location (or desired location on first iteration)


      if (start + localOffset <= maxLine) {
        return localOffset;
      }

      forwardExhausted = true;
    }

    if (!backwardExhausted) {
      if (!forwardExhausted) {
        wantForward = true;
      } // Check if trying to fit before text beginning, and if not, check it fits
      // before offset location


      if (minLine <= start - localOffset) {
        return -localOffset++;
      }

      backwardExhausted = true;
      return iterator();
    } // We tried to fit hunk before text beginning and beyond text length, then
    // hunk can't fit on the text. Return undefined

  };
}

function applyPatch(source, uniDiff) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (typeof uniDiff === 'string') {
    uniDiff = parsePatch(uniDiff);
  }

  if (Array.isArray(uniDiff)) {
    if (uniDiff.length > 1) {
      throw new Error('applyPatch only works with a single input.');
    }

    uniDiff = uniDiff[0];
  } // Apply the diff to the input


  var lines = source.split(/\r\n|[\n\v\f\r\x85]/),
      delimiters = source.match(/\r\n|[\n\v\f\r\x85]/g) || [],
      hunks = uniDiff.hunks,
      compareLine = options.compareLine || function (lineNumber, line, operation, patchContent) {
    return line === patchContent;
  },
      errorCount = 0,
      fuzzFactor = options.fuzzFactor || 0,
      minLine = 0,
      offset = 0,
      removeEOFNL,
      addEOFNL;
  /**
   * Checks if the hunk exactly fits on the provided location
   */


  function hunkFits(hunk, toPos) {
    for (var j = 0; j < hunk.lines.length; j++) {
      var line = hunk.lines[j],
          operation = line.length > 0 ? line[0] : ' ',
          content = line.length > 0 ? line.substr(1) : line;

      if (operation === ' ' || operation === '-') {
        // Context sanity check
        if (!compareLine(toPos + 1, lines[toPos], operation, content)) {
          errorCount++;

          if (errorCount > fuzzFactor) {
            return false;
          }
        }

        toPos++;
      }
    }

    return true;
  } // Search best fit offsets for each hunk based on the previous ones


  for (var i = 0; i < hunks.length; i++) {
    var hunk = hunks[i],
        maxLine = lines.length - hunk.oldLines,
        localOffset = 0,
        toPos = offset + hunk.oldStart - 1;
    var iterator = distanceIterator(toPos, minLine, maxLine);

    for (; localOffset !== undefined; localOffset = iterator()) {
      if (hunkFits(hunk, toPos + localOffset)) {
        hunk.offset = offset += localOffset;
        break;
      }
    }

    if (localOffset === undefined) {
      return false;
    } // Set lower text limit to end of the current hunk, so next ones don't try
    // to fit over already patched text


    minLine = hunk.offset + hunk.oldStart + hunk.oldLines;
  } // Apply patch hunks


  var diffOffset = 0;

  for (var _i = 0; _i < hunks.length; _i++) {
    var _hunk = hunks[_i],
        _toPos = _hunk.oldStart + _hunk.offset + diffOffset - 1;

    diffOffset += _hunk.newLines - _hunk.oldLines;

    if (_toPos < 0) {
      // Creating a new file
      _toPos = 0;
    }

    for (var j = 0; j < _hunk.lines.length; j++) {
      var line = _hunk.lines[j],
          operation = line.length > 0 ? line[0] : ' ',
          content = line.length > 0 ? line.substr(1) : line,
          delimiter = _hunk.linedelimiters[j];

      if (operation === ' ') {
        _toPos++;
      } else if (operation === '-') {
        lines.splice(_toPos, 1);
        delimiters.splice(_toPos, 1);
        /* istanbul ignore else */
      } else if (operation === '+') {
        lines.splice(_toPos, 0, content);
        delimiters.splice(_toPos, 0, delimiter);
        _toPos++;
      } else if (operation === '\\') {
        var previousOperation = _hunk.lines[j - 1] ? _hunk.lines[j - 1][0] : null;

        if (previousOperation === '+') {
          removeEOFNL = true;
        } else if (previousOperation === '-') {
          addEOFNL = true;
        }
      }
    }
  } // Handle EOFNL insertion/removal


  if (removeEOFNL) {
    while (!lines[lines.length - 1]) {
      lines.pop();
      delimiters.pop();
    }
  } else if (addEOFNL) {
    lines.push('');
    delimiters.push('\n');
  }

  for (var _k = 0; _k < lines.length - 1; _k++) {
    lines[_k] = lines[_k] + delimiters[_k];
  }

  return lines.join('');
} // Wrapper that supports multiple file patches via callbacks.

function applyPatches(uniDiff, options) {
  if (typeof uniDiff === 'string') {
    uniDiff = parsePatch(uniDiff);
  }

  var currentIndex = 0;

  function processIndex() {
    var index = uniDiff[currentIndex++];

    if (!index) {
      return options.complete();
    }

    options.loadFile(index, function (err, data) {
      if (err) {
        return options.complete(err);
      }

      var updatedContent = applyPatch(data, index, options);
      options.patched(index, updatedContent, function (err) {
        if (err) {
          return options.complete(err);
        }

        processIndex();
      });
    });
  }

  processIndex();
}

function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (!options) {
    options = {};
  }

  if (typeof options.context === 'undefined') {
    options.context = 4;
  }

  var diff = diffLines(oldStr, newStr, options);
  diff.push({
    value: '',
    lines: []
  }); // Append an empty value to make cleanup easier

  function contextLines(lines) {
    return lines.map(function (entry) {
      return ' ' + entry;
    });
  }

  var hunks = [];
  var oldRangeStart = 0,
      newRangeStart = 0,
      curRange = [],
      oldLine = 1,
      newLine = 1;

  var _loop = function _loop(i) {
    var current = diff[i],
        lines = current.lines || current.value.replace(/\n$/, '').split('\n');
    current.lines = lines;

    if (current.added || current.removed) {
      var _curRange;

      // If we have previous context, start with that
      if (!oldRangeStart) {
        var prev = diff[i - 1];
        oldRangeStart = oldLine;
        newRangeStart = newLine;

        if (prev) {
          curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
          oldRangeStart -= curRange.length;
          newRangeStart -= curRange.length;
        }
      } // Output our changes


      (_curRange = curRange).push.apply(_curRange, _toConsumableArray(lines.map(function (entry) {
        return (current.added ? '+' : '-') + entry;
      }))); // Track the updated file position


      if (current.added) {
        newLine += lines.length;
      } else {
        oldLine += lines.length;
      }
    } else {
      // Identical context lines. Track line changes
      if (oldRangeStart) {
        // Close out any changes that have been output (or join overlapping)
        if (lines.length <= options.context * 2 && i < diff.length - 2) {
          var _curRange2;

          // Overlapping
          (_curRange2 = curRange).push.apply(_curRange2, _toConsumableArray(contextLines(lines)));
        } else {
          var _curRange3;

          // end the range and output
          var contextSize = Math.min(lines.length, options.context);

          (_curRange3 = curRange).push.apply(_curRange3, _toConsumableArray(contextLines(lines.slice(0, contextSize))));

          var hunk = {
            oldStart: oldRangeStart,
            oldLines: oldLine - oldRangeStart + contextSize,
            newStart: newRangeStart,
            newLines: newLine - newRangeStart + contextSize,
            lines: curRange
          };

          if (i >= diff.length - 2 && lines.length <= options.context) {
            // EOF is inside this hunk
            var oldEOFNewline = /\n$/.test(oldStr);
            var newEOFNewline = /\n$/.test(newStr);
            var noNlBeforeAdds = lines.length == 0 && curRange.length > hunk.oldLines;

            if (!oldEOFNewline && noNlBeforeAdds) {
              // special case: old has no eol and no trailing context; no-nl can end up before adds
              curRange.splice(hunk.oldLines, 0, '\\ No newline at end of file');
            }

            if (!oldEOFNewline && !noNlBeforeAdds || !newEOFNewline) {
              curRange.push('\\ No newline at end of file');
            }
          }

          hunks.push(hunk);
          oldRangeStart = 0;
          newRangeStart = 0;
          curRange = [];
        }
      }

      oldLine += lines.length;
      newLine += lines.length;
    }
  };

  for (var i = 0; i < diff.length; i++) {
    _loop(i);
  }

  return {
    oldFileName: oldFileName,
    newFileName: newFileName,
    oldHeader: oldHeader,
    newHeader: newHeader,
    hunks: hunks
  };
}
function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  var diff = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);
  var ret = [];

  if (oldFileName == newFileName) {
    ret.push('Index: ' + oldFileName);
  }

  ret.push('===================================================================');
  ret.push('--- ' + diff.oldFileName + (typeof diff.oldHeader === 'undefined' ? '' : '\t' + diff.oldHeader));
  ret.push('+++ ' + diff.newFileName + (typeof diff.newHeader === 'undefined' ? '' : '\t' + diff.newHeader));

  for (var i = 0; i < diff.hunks.length; i++) {
    var hunk = diff.hunks[i];
    ret.push('@@ -' + hunk.oldStart + ',' + hunk.oldLines + ' +' + hunk.newStart + ',' + hunk.newLines + ' @@');
    ret.push.apply(ret, hunk.lines);
  }

  return ret.join('\n') + '\n';
}
function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
  return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
}

function arrayEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  return arrayStartsWith(a, b);
}
function arrayStartsWith(array, start) {
  if (start.length > array.length) {
    return false;
  }

  for (var i = 0; i < start.length; i++) {
    if (start[i] !== array[i]) {
      return false;
    }
  }

  return true;
}

function calcLineCount(hunk) {
  var _calcOldNewLineCount = calcOldNewLineCount(hunk.lines),
      oldLines = _calcOldNewLineCount.oldLines,
      newLines = _calcOldNewLineCount.newLines;

  if (oldLines !== undefined) {
    hunk.oldLines = oldLines;
  } else {
    delete hunk.oldLines;
  }

  if (newLines !== undefined) {
    hunk.newLines = newLines;
  } else {
    delete hunk.newLines;
  }
}
function merge(mine, theirs, base) {
  mine = loadPatch(mine, base);
  theirs = loadPatch(theirs, base);
  var ret = {}; // For index we just let it pass through as it doesn't have any necessary meaning.
  // Leaving sanity checks on this to the API consumer that may know more about the
  // meaning in their own context.

  if (mine.index || theirs.index) {
    ret.index = mine.index || theirs.index;
  }

  if (mine.newFileName || theirs.newFileName) {
    if (!fileNameChanged(mine)) {
      // No header or no change in ours, use theirs (and ours if theirs does not exist)
      ret.oldFileName = theirs.oldFileName || mine.oldFileName;
      ret.newFileName = theirs.newFileName || mine.newFileName;
      ret.oldHeader = theirs.oldHeader || mine.oldHeader;
      ret.newHeader = theirs.newHeader || mine.newHeader;
    } else if (!fileNameChanged(theirs)) {
      // No header or no change in theirs, use ours
      ret.oldFileName = mine.oldFileName;
      ret.newFileName = mine.newFileName;
      ret.oldHeader = mine.oldHeader;
      ret.newHeader = mine.newHeader;
    } else {
      // Both changed... figure it out
      ret.oldFileName = selectField(ret, mine.oldFileName, theirs.oldFileName);
      ret.newFileName = selectField(ret, mine.newFileName, theirs.newFileName);
      ret.oldHeader = selectField(ret, mine.oldHeader, theirs.oldHeader);
      ret.newHeader = selectField(ret, mine.newHeader, theirs.newHeader);
    }
  }

  ret.hunks = [];
  var mineIndex = 0,
      theirsIndex = 0,
      mineOffset = 0,
      theirsOffset = 0;

  while (mineIndex < mine.hunks.length || theirsIndex < theirs.hunks.length) {
    var mineCurrent = mine.hunks[mineIndex] || {
      oldStart: Infinity
    },
        theirsCurrent = theirs.hunks[theirsIndex] || {
      oldStart: Infinity
    };

    if (hunkBefore(mineCurrent, theirsCurrent)) {
      // This patch does not overlap with any of the others, yay.
      ret.hunks.push(cloneHunk(mineCurrent, mineOffset));
      mineIndex++;
      theirsOffset += mineCurrent.newLines - mineCurrent.oldLines;
    } else if (hunkBefore(theirsCurrent, mineCurrent)) {
      // This patch does not overlap with any of the others, yay.
      ret.hunks.push(cloneHunk(theirsCurrent, theirsOffset));
      theirsIndex++;
      mineOffset += theirsCurrent.newLines - theirsCurrent.oldLines;
    } else {
      // Overlap, merge as best we can
      var mergedHunk = {
        oldStart: Math.min(mineCurrent.oldStart, theirsCurrent.oldStart),
        oldLines: 0,
        newStart: Math.min(mineCurrent.newStart + mineOffset, theirsCurrent.oldStart + theirsOffset),
        newLines: 0,
        lines: []
      };
      mergeLines(mergedHunk, mineCurrent.oldStart, mineCurrent.lines, theirsCurrent.oldStart, theirsCurrent.lines);
      theirsIndex++;
      mineIndex++;
      ret.hunks.push(mergedHunk);
    }
  }

  return ret;
}

function loadPatch(param, base) {
  if (typeof param === 'string') {
    if (/^@@/m.test(param) || /^Index:/m.test(param)) {
      return parsePatch(param)[0];
    }

    if (!base) {
      throw new Error('Must provide a base reference or pass in a patch');
    }

    return structuredPatch(undefined, undefined, base, param);
  }

  return param;
}

function fileNameChanged(patch) {
  return patch.newFileName && patch.newFileName !== patch.oldFileName;
}

function selectField(index, mine, theirs) {
  if (mine === theirs) {
    return mine;
  } else {
    index.conflict = true;
    return {
      mine: mine,
      theirs: theirs
    };
  }
}

function hunkBefore(test, check) {
  return test.oldStart < check.oldStart && test.oldStart + test.oldLines < check.oldStart;
}

function cloneHunk(hunk, offset) {
  return {
    oldStart: hunk.oldStart,
    oldLines: hunk.oldLines,
    newStart: hunk.newStart + offset,
    newLines: hunk.newLines,
    lines: hunk.lines
  };
}

function mergeLines(hunk, mineOffset, mineLines, theirOffset, theirLines) {
  // This will generally result in a conflicted hunk, but there are cases where the context
  // is the only overlap where we can successfully merge the content here.
  var mine = {
    offset: mineOffset,
    lines: mineLines,
    index: 0
  },
      their = {
    offset: theirOffset,
    lines: theirLines,
    index: 0
  }; // Handle any leading content

  insertLeading(hunk, mine, their);
  insertLeading(hunk, their, mine); // Now in the overlap content. Scan through and select the best changes from each.

  while (mine.index < mine.lines.length && their.index < their.lines.length) {
    var mineCurrent = mine.lines[mine.index],
        theirCurrent = their.lines[their.index];

    if ((mineCurrent[0] === '-' || mineCurrent[0] === '+') && (theirCurrent[0] === '-' || theirCurrent[0] === '+')) {
      // Both modified ...
      mutualChange(hunk, mine, their);
    } else if (mineCurrent[0] === '+' && theirCurrent[0] === ' ') {
      var _hunk$lines;

      // Mine inserted
      (_hunk$lines = hunk.lines).push.apply(_hunk$lines, _toConsumableArray(collectChange(mine)));
    } else if (theirCurrent[0] === '+' && mineCurrent[0] === ' ') {
      var _hunk$lines2;

      // Theirs inserted
      (_hunk$lines2 = hunk.lines).push.apply(_hunk$lines2, _toConsumableArray(collectChange(their)));
    } else if (mineCurrent[0] === '-' && theirCurrent[0] === ' ') {
      // Mine removed or edited
      removal(hunk, mine, their);
    } else if (theirCurrent[0] === '-' && mineCurrent[0] === ' ') {
      // Their removed or edited
      removal(hunk, their, mine, true);
    } else if (mineCurrent === theirCurrent) {
      // Context identity
      hunk.lines.push(mineCurrent);
      mine.index++;
      their.index++;
    } else {
      // Context mismatch
      conflict(hunk, collectChange(mine), collectChange(their));
    }
  } // Now push anything that may be remaining


  insertTrailing(hunk, mine);
  insertTrailing(hunk, their);
  calcLineCount(hunk);
}

function mutualChange(hunk, mine, their) {
  var myChanges = collectChange(mine),
      theirChanges = collectChange(their);

  if (allRemoves(myChanges) && allRemoves(theirChanges)) {
    // Special case for remove changes that are supersets of one another
    if (arrayStartsWith(myChanges, theirChanges) && skipRemoveSuperset(their, myChanges, myChanges.length - theirChanges.length)) {
      var _hunk$lines3;

      (_hunk$lines3 = hunk.lines).push.apply(_hunk$lines3, _toConsumableArray(myChanges));

      return;
    } else if (arrayStartsWith(theirChanges, myChanges) && skipRemoveSuperset(mine, theirChanges, theirChanges.length - myChanges.length)) {
      var _hunk$lines4;

      (_hunk$lines4 = hunk.lines).push.apply(_hunk$lines4, _toConsumableArray(theirChanges));

      return;
    }
  } else if (arrayEqual(myChanges, theirChanges)) {
    var _hunk$lines5;

    (_hunk$lines5 = hunk.lines).push.apply(_hunk$lines5, _toConsumableArray(myChanges));

    return;
  }

  conflict(hunk, myChanges, theirChanges);
}

function removal(hunk, mine, their, swap) {
  var myChanges = collectChange(mine),
      theirChanges = collectContext(their, myChanges);

  if (theirChanges.merged) {
    var _hunk$lines6;

    (_hunk$lines6 = hunk.lines).push.apply(_hunk$lines6, _toConsumableArray(theirChanges.merged));
  } else {
    conflict(hunk, swap ? theirChanges : myChanges, swap ? myChanges : theirChanges);
  }
}

function conflict(hunk, mine, their) {
  hunk.conflict = true;
  hunk.lines.push({
    conflict: true,
    mine: mine,
    theirs: their
  });
}

function insertLeading(hunk, insert, their) {
  while (insert.offset < their.offset && insert.index < insert.lines.length) {
    var line = insert.lines[insert.index++];
    hunk.lines.push(line);
    insert.offset++;
  }
}

function insertTrailing(hunk, insert) {
  while (insert.index < insert.lines.length) {
    var line = insert.lines[insert.index++];
    hunk.lines.push(line);
  }
}

function collectChange(state) {
  var ret = [],
      operation = state.lines[state.index][0];

  while (state.index < state.lines.length) {
    var line = state.lines[state.index]; // Group additions that are immediately after subtractions and treat them as one "atomic" modify change.

    if (operation === '-' && line[0] === '+') {
      operation = '+';
    }

    if (operation === line[0]) {
      ret.push(line);
      state.index++;
    } else {
      break;
    }
  }

  return ret;
}

function collectContext(state, matchChanges) {
  var changes = [],
      merged = [],
      matchIndex = 0,
      contextChanges = false,
      conflicted = false;

  while (matchIndex < matchChanges.length && state.index < state.lines.length) {
    var change = state.lines[state.index],
        match = matchChanges[matchIndex]; // Once we've hit our add, then we are done

    if (match[0] === '+') {
      break;
    }

    contextChanges = contextChanges || change[0] !== ' ';
    merged.push(match);
    matchIndex++; // Consume any additions in the other block as a conflict to attempt
    // to pull in the remaining context after this

    if (change[0] === '+') {
      conflicted = true;

      while (change[0] === '+') {
        changes.push(change);
        change = state.lines[++state.index];
      }
    }

    if (match.substr(1) === change.substr(1)) {
      changes.push(change);
      state.index++;
    } else {
      conflicted = true;
    }
  }

  if ((matchChanges[matchIndex] || '')[0] === '+' && contextChanges) {
    conflicted = true;
  }

  if (conflicted) {
    return changes;
  }

  while (matchIndex < matchChanges.length) {
    merged.push(matchChanges[matchIndex++]);
  }

  return {
    merged: merged,
    changes: changes
  };
}

function allRemoves(changes) {
  return changes.reduce(function (prev, change) {
    return prev && change[0] === '-';
  }, true);
}

function skipRemoveSuperset(state, removeChanges, delta) {
  for (var i = 0; i < delta; i++) {
    var changeContent = removeChanges[removeChanges.length - delta + i].substr(1);

    if (state.lines[state.index + i] !== ' ' + changeContent) {
      return false;
    }
  }

  state.index += delta;
  return true;
}

function calcOldNewLineCount(lines) {
  var oldLines = 0;
  var newLines = 0;
  lines.forEach(function (line) {
    if (typeof line !== 'string') {
      var myCount = calcOldNewLineCount(line.mine);
      var theirCount = calcOldNewLineCount(line.theirs);

      if (oldLines !== undefined) {
        if (myCount.oldLines === theirCount.oldLines) {
          oldLines += myCount.oldLines;
        } else {
          oldLines = undefined;
        }
      }

      if (newLines !== undefined) {
        if (myCount.newLines === theirCount.newLines) {
          newLines += myCount.newLines;
        } else {
          newLines = undefined;
        }
      }
    } else {
      if (newLines !== undefined && (line[0] === '+' || line[0] === ' ')) {
        newLines++;
      }

      if (oldLines !== undefined && (line[0] === '-' || line[0] === ' ')) {
        oldLines++;
      }
    }
  });
  return {
    oldLines: oldLines,
    newLines: newLines
  };
}

// See: http://code.google.com/p/google-diff-match-patch/wiki/API
function convertChangesToDMP(changes) {
  var ret = [],
      change,
      operation;

  for (var i = 0; i < changes.length; i++) {
    change = changes[i];

    if (change.added) {
      operation = 1;
    } else if (change.removed) {
      operation = -1;
    } else {
      operation = 0;
    }

    ret.push([operation, change.value]);
  }

  return ret;
}

function convertChangesToXML(changes) {
  var ret = [];

  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];

    if (change.added) {
      ret.push('<ins>');
    } else if (change.removed) {
      ret.push('<del>');
    }

    ret.push(escapeHTML(change.value));

    if (change.added) {
      ret.push('</ins>');
    } else if (change.removed) {
      ret.push('</del>');
    }
  }

  return ret.join('');
}

function escapeHTML(s) {
  var n = s;
  n = n.replace(/&/g, '&amp;');
  n = n.replace(/</g, '&lt;');
  n = n.replace(/>/g, '&gt;');
  n = n.replace(/"/g, '&quot;');
  return n;
}

var index_es6 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Diff: Diff,
	diffChars: diffChars,
	diffWords: diffWords,
	diffWordsWithSpace: diffWordsWithSpace,
	diffLines: diffLines,
	diffTrimmedLines: diffTrimmedLines,
	diffSentences: diffSentences,
	diffCss: diffCss,
	diffJson: diffJson,
	diffArrays: diffArrays,
	structuredPatch: structuredPatch,
	createTwoFilesPatch: createTwoFilesPatch,
	createPatch: createPatch,
	applyPatch: applyPatch,
	applyPatches: applyPatches,
	parsePatch: parsePatch,
	merge: merge,
	convertChangesToDMP: convertChangesToDMP,
	convertChangesToXML: convertChangesToXML,
	canonicalize: canonicalize
});

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

var ms = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}

var he = createCommonjsModule(function (module, exports) {
(function(root) {

	// Detect free variables `exports`.
	var freeExports =  exports;

	// Detect free variable `module`.
	var freeModule =  module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`.
	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	// All astral symbols.
	var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
	// All ASCII symbols (not just printable ASCII) except those listed in the
	// first column of the overrides table.
	// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides
	var regexAsciiWhitelist = /[\x01-\x7F]/g;
	// All BMP symbols that are not ASCII newlines, printable ASCII symbols, or
	// code points listed in the first column of the overrides table on
	// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides.
	var regexBmpWhitelist = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;

	var regexEncodeNonAscii = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g;
	var encodeMap = {'\xAD':'shy','\u200C':'zwnj','\u200D':'zwj','\u200E':'lrm','\u2063':'ic','\u2062':'it','\u2061':'af','\u200F':'rlm','\u200B':'ZeroWidthSpace','\u2060':'NoBreak','\u0311':'DownBreve','\u20DB':'tdot','\u20DC':'DotDot','\t':'Tab','\n':'NewLine','\u2008':'puncsp','\u205F':'MediumSpace','\u2009':'thinsp','\u200A':'hairsp','\u2004':'emsp13','\u2002':'ensp','\u2005':'emsp14','\u2003':'emsp','\u2007':'numsp','\xA0':'nbsp','\u205F\u200A':'ThickSpace','\u203E':'oline','_':'lowbar','\u2010':'dash','\u2013':'ndash','\u2014':'mdash','\u2015':'horbar',',':'comma',';':'semi','\u204F':'bsemi',':':'colon','\u2A74':'Colone','!':'excl','\xA1':'iexcl','?':'quest','\xBF':'iquest','.':'period','\u2025':'nldr','\u2026':'mldr','\xB7':'middot','\'':'apos','\u2018':'lsquo','\u2019':'rsquo','\u201A':'sbquo','\u2039':'lsaquo','\u203A':'rsaquo','"':'quot','\u201C':'ldquo','\u201D':'rdquo','\u201E':'bdquo','\xAB':'laquo','\xBB':'raquo','(':'lpar',')':'rpar','[':'lsqb',']':'rsqb','{':'lcub','}':'rcub','\u2308':'lceil','\u2309':'rceil','\u230A':'lfloor','\u230B':'rfloor','\u2985':'lopar','\u2986':'ropar','\u298B':'lbrke','\u298C':'rbrke','\u298D':'lbrkslu','\u298E':'rbrksld','\u298F':'lbrksld','\u2990':'rbrkslu','\u2991':'langd','\u2992':'rangd','\u2993':'lparlt','\u2994':'rpargt','\u2995':'gtlPar','\u2996':'ltrPar','\u27E6':'lobrk','\u27E7':'robrk','\u27E8':'lang','\u27E9':'rang','\u27EA':'Lang','\u27EB':'Rang','\u27EC':'loang','\u27ED':'roang','\u2772':'lbbrk','\u2773':'rbbrk','\u2016':'Vert','\xA7':'sect','\xB6':'para','@':'commat','*':'ast','/':'sol','undefined':null,'&':'amp','#':'num','%':'percnt','\u2030':'permil','\u2031':'pertenk','\u2020':'dagger','\u2021':'Dagger','\u2022':'bull','\u2043':'hybull','\u2032':'prime','\u2033':'Prime','\u2034':'tprime','\u2057':'qprime','\u2035':'bprime','\u2041':'caret','`':'grave','\xB4':'acute','\u02DC':'tilde','^':'Hat','\xAF':'macr','\u02D8':'breve','\u02D9':'dot','\xA8':'die','\u02DA':'ring','\u02DD':'dblac','\xB8':'cedil','\u02DB':'ogon','\u02C6':'circ','\u02C7':'caron','\xB0':'deg','\xA9':'copy','\xAE':'reg','\u2117':'copysr','\u2118':'wp','\u211E':'rx','\u2127':'mho','\u2129':'iiota','\u2190':'larr','\u219A':'nlarr','\u2192':'rarr','\u219B':'nrarr','\u2191':'uarr','\u2193':'darr','\u2194':'harr','\u21AE':'nharr','\u2195':'varr','\u2196':'nwarr','\u2197':'nearr','\u2198':'searr','\u2199':'swarr','\u219D':'rarrw','\u219D\u0338':'nrarrw','\u219E':'Larr','\u219F':'Uarr','\u21A0':'Rarr','\u21A1':'Darr','\u21A2':'larrtl','\u21A3':'rarrtl','\u21A4':'mapstoleft','\u21A5':'mapstoup','\u21A6':'map','\u21A7':'mapstodown','\u21A9':'larrhk','\u21AA':'rarrhk','\u21AB':'larrlp','\u21AC':'rarrlp','\u21AD':'harrw','\u21B0':'lsh','\u21B1':'rsh','\u21B2':'ldsh','\u21B3':'rdsh','\u21B5':'crarr','\u21B6':'cularr','\u21B7':'curarr','\u21BA':'olarr','\u21BB':'orarr','\u21BC':'lharu','\u21BD':'lhard','\u21BE':'uharr','\u21BF':'uharl','\u21C0':'rharu','\u21C1':'rhard','\u21C2':'dharr','\u21C3':'dharl','\u21C4':'rlarr','\u21C5':'udarr','\u21C6':'lrarr','\u21C7':'llarr','\u21C8':'uuarr','\u21C9':'rrarr','\u21CA':'ddarr','\u21CB':'lrhar','\u21CC':'rlhar','\u21D0':'lArr','\u21CD':'nlArr','\u21D1':'uArr','\u21D2':'rArr','\u21CF':'nrArr','\u21D3':'dArr','\u21D4':'iff','\u21CE':'nhArr','\u21D5':'vArr','\u21D6':'nwArr','\u21D7':'neArr','\u21D8':'seArr','\u21D9':'swArr','\u21DA':'lAarr','\u21DB':'rAarr','\u21DD':'zigrarr','\u21E4':'larrb','\u21E5':'rarrb','\u21F5':'duarr','\u21FD':'loarr','\u21FE':'roarr','\u21FF':'hoarr','\u2200':'forall','\u2201':'comp','\u2202':'part','\u2202\u0338':'npart','\u2203':'exist','\u2204':'nexist','\u2205':'empty','\u2207':'Del','\u2208':'in','\u2209':'notin','\u220B':'ni','\u220C':'notni','\u03F6':'bepsi','\u220F':'prod','\u2210':'coprod','\u2211':'sum','+':'plus','\xB1':'pm','\xF7':'div','\xD7':'times','<':'lt','\u226E':'nlt','<\u20D2':'nvlt','=':'equals','\u2260':'ne','=\u20E5':'bne','\u2A75':'Equal','>':'gt','\u226F':'ngt','>\u20D2':'nvgt','\xAC':'not','|':'vert','\xA6':'brvbar','\u2212':'minus','\u2213':'mp','\u2214':'plusdo','\u2044':'frasl','\u2216':'setmn','\u2217':'lowast','\u2218':'compfn','\u221A':'Sqrt','\u221D':'prop','\u221E':'infin','\u221F':'angrt','\u2220':'ang','\u2220\u20D2':'nang','\u2221':'angmsd','\u2222':'angsph','\u2223':'mid','\u2224':'nmid','\u2225':'par','\u2226':'npar','\u2227':'and','\u2228':'or','\u2229':'cap','\u2229\uFE00':'caps','\u222A':'cup','\u222A\uFE00':'cups','\u222B':'int','\u222C':'Int','\u222D':'tint','\u2A0C':'qint','\u222E':'oint','\u222F':'Conint','\u2230':'Cconint','\u2231':'cwint','\u2232':'cwconint','\u2233':'awconint','\u2234':'there4','\u2235':'becaus','\u2236':'ratio','\u2237':'Colon','\u2238':'minusd','\u223A':'mDDot','\u223B':'homtht','\u223C':'sim','\u2241':'nsim','\u223C\u20D2':'nvsim','\u223D':'bsim','\u223D\u0331':'race','\u223E':'ac','\u223E\u0333':'acE','\u223F':'acd','\u2240':'wr','\u2242':'esim','\u2242\u0338':'nesim','\u2243':'sime','\u2244':'nsime','\u2245':'cong','\u2247':'ncong','\u2246':'simne','\u2248':'ap','\u2249':'nap','\u224A':'ape','\u224B':'apid','\u224B\u0338':'napid','\u224C':'bcong','\u224D':'CupCap','\u226D':'NotCupCap','\u224D\u20D2':'nvap','\u224E':'bump','\u224E\u0338':'nbump','\u224F':'bumpe','\u224F\u0338':'nbumpe','\u2250':'doteq','\u2250\u0338':'nedot','\u2251':'eDot','\u2252':'efDot','\u2253':'erDot','\u2254':'colone','\u2255':'ecolon','\u2256':'ecir','\u2257':'cire','\u2259':'wedgeq','\u225A':'veeeq','\u225C':'trie','\u225F':'equest','\u2261':'equiv','\u2262':'nequiv','\u2261\u20E5':'bnequiv','\u2264':'le','\u2270':'nle','\u2264\u20D2':'nvle','\u2265':'ge','\u2271':'nge','\u2265\u20D2':'nvge','\u2266':'lE','\u2266\u0338':'nlE','\u2267':'gE','\u2267\u0338':'ngE','\u2268\uFE00':'lvnE','\u2268':'lnE','\u2269':'gnE','\u2269\uFE00':'gvnE','\u226A':'ll','\u226A\u0338':'nLtv','\u226A\u20D2':'nLt','\u226B':'gg','\u226B\u0338':'nGtv','\u226B\u20D2':'nGt','\u226C':'twixt','\u2272':'lsim','\u2274':'nlsim','\u2273':'gsim','\u2275':'ngsim','\u2276':'lg','\u2278':'ntlg','\u2277':'gl','\u2279':'ntgl','\u227A':'pr','\u2280':'npr','\u227B':'sc','\u2281':'nsc','\u227C':'prcue','\u22E0':'nprcue','\u227D':'sccue','\u22E1':'nsccue','\u227E':'prsim','\u227F':'scsim','\u227F\u0338':'NotSucceedsTilde','\u2282':'sub','\u2284':'nsub','\u2282\u20D2':'vnsub','\u2283':'sup','\u2285':'nsup','\u2283\u20D2':'vnsup','\u2286':'sube','\u2288':'nsube','\u2287':'supe','\u2289':'nsupe','\u228A\uFE00':'vsubne','\u228A':'subne','\u228B\uFE00':'vsupne','\u228B':'supne','\u228D':'cupdot','\u228E':'uplus','\u228F':'sqsub','\u228F\u0338':'NotSquareSubset','\u2290':'sqsup','\u2290\u0338':'NotSquareSuperset','\u2291':'sqsube','\u22E2':'nsqsube','\u2292':'sqsupe','\u22E3':'nsqsupe','\u2293':'sqcap','\u2293\uFE00':'sqcaps','\u2294':'sqcup','\u2294\uFE00':'sqcups','\u2295':'oplus','\u2296':'ominus','\u2297':'otimes','\u2298':'osol','\u2299':'odot','\u229A':'ocir','\u229B':'oast','\u229D':'odash','\u229E':'plusb','\u229F':'minusb','\u22A0':'timesb','\u22A1':'sdotb','\u22A2':'vdash','\u22AC':'nvdash','\u22A3':'dashv','\u22A4':'top','\u22A5':'bot','\u22A7':'models','\u22A8':'vDash','\u22AD':'nvDash','\u22A9':'Vdash','\u22AE':'nVdash','\u22AA':'Vvdash','\u22AB':'VDash','\u22AF':'nVDash','\u22B0':'prurel','\u22B2':'vltri','\u22EA':'nltri','\u22B3':'vrtri','\u22EB':'nrtri','\u22B4':'ltrie','\u22EC':'nltrie','\u22B4\u20D2':'nvltrie','\u22B5':'rtrie','\u22ED':'nrtrie','\u22B5\u20D2':'nvrtrie','\u22B6':'origof','\u22B7':'imof','\u22B8':'mumap','\u22B9':'hercon','\u22BA':'intcal','\u22BB':'veebar','\u22BD':'barvee','\u22BE':'angrtvb','\u22BF':'lrtri','\u22C0':'Wedge','\u22C1':'Vee','\u22C2':'xcap','\u22C3':'xcup','\u22C4':'diam','\u22C5':'sdot','\u22C6':'Star','\u22C7':'divonx','\u22C8':'bowtie','\u22C9':'ltimes','\u22CA':'rtimes','\u22CB':'lthree','\u22CC':'rthree','\u22CD':'bsime','\u22CE':'cuvee','\u22CF':'cuwed','\u22D0':'Sub','\u22D1':'Sup','\u22D2':'Cap','\u22D3':'Cup','\u22D4':'fork','\u22D5':'epar','\u22D6':'ltdot','\u22D7':'gtdot','\u22D8':'Ll','\u22D8\u0338':'nLl','\u22D9':'Gg','\u22D9\u0338':'nGg','\u22DA\uFE00':'lesg','\u22DA':'leg','\u22DB':'gel','\u22DB\uFE00':'gesl','\u22DE':'cuepr','\u22DF':'cuesc','\u22E6':'lnsim','\u22E7':'gnsim','\u22E8':'prnsim','\u22E9':'scnsim','\u22EE':'vellip','\u22EF':'ctdot','\u22F0':'utdot','\u22F1':'dtdot','\u22F2':'disin','\u22F3':'isinsv','\u22F4':'isins','\u22F5':'isindot','\u22F5\u0338':'notindot','\u22F6':'notinvc','\u22F7':'notinvb','\u22F9':'isinE','\u22F9\u0338':'notinE','\u22FA':'nisd','\u22FB':'xnis','\u22FC':'nis','\u22FD':'notnivc','\u22FE':'notnivb','\u2305':'barwed','\u2306':'Barwed','\u230C':'drcrop','\u230D':'dlcrop','\u230E':'urcrop','\u230F':'ulcrop','\u2310':'bnot','\u2312':'profline','\u2313':'profsurf','\u2315':'telrec','\u2316':'target','\u231C':'ulcorn','\u231D':'urcorn','\u231E':'dlcorn','\u231F':'drcorn','\u2322':'frown','\u2323':'smile','\u232D':'cylcty','\u232E':'profalar','\u2336':'topbot','\u233D':'ovbar','\u233F':'solbar','\u237C':'angzarr','\u23B0':'lmoust','\u23B1':'rmoust','\u23B4':'tbrk','\u23B5':'bbrk','\u23B6':'bbrktbrk','\u23DC':'OverParenthesis','\u23DD':'UnderParenthesis','\u23DE':'OverBrace','\u23DF':'UnderBrace','\u23E2':'trpezium','\u23E7':'elinters','\u2423':'blank','\u2500':'boxh','\u2502':'boxv','\u250C':'boxdr','\u2510':'boxdl','\u2514':'boxur','\u2518':'boxul','\u251C':'boxvr','\u2524':'boxvl','\u252C':'boxhd','\u2534':'boxhu','\u253C':'boxvh','\u2550':'boxH','\u2551':'boxV','\u2552':'boxdR','\u2553':'boxDr','\u2554':'boxDR','\u2555':'boxdL','\u2556':'boxDl','\u2557':'boxDL','\u2558':'boxuR','\u2559':'boxUr','\u255A':'boxUR','\u255B':'boxuL','\u255C':'boxUl','\u255D':'boxUL','\u255E':'boxvR','\u255F':'boxVr','\u2560':'boxVR','\u2561':'boxvL','\u2562':'boxVl','\u2563':'boxVL','\u2564':'boxHd','\u2565':'boxhD','\u2566':'boxHD','\u2567':'boxHu','\u2568':'boxhU','\u2569':'boxHU','\u256A':'boxvH','\u256B':'boxVh','\u256C':'boxVH','\u2580':'uhblk','\u2584':'lhblk','\u2588':'block','\u2591':'blk14','\u2592':'blk12','\u2593':'blk34','\u25A1':'squ','\u25AA':'squf','\u25AB':'EmptyVerySmallSquare','\u25AD':'rect','\u25AE':'marker','\u25B1':'fltns','\u25B3':'xutri','\u25B4':'utrif','\u25B5':'utri','\u25B8':'rtrif','\u25B9':'rtri','\u25BD':'xdtri','\u25BE':'dtrif','\u25BF':'dtri','\u25C2':'ltrif','\u25C3':'ltri','\u25CA':'loz','\u25CB':'cir','\u25EC':'tridot','\u25EF':'xcirc','\u25F8':'ultri','\u25F9':'urtri','\u25FA':'lltri','\u25FB':'EmptySmallSquare','\u25FC':'FilledSmallSquare','\u2605':'starf','\u2606':'star','\u260E':'phone','\u2640':'female','\u2642':'male','\u2660':'spades','\u2663':'clubs','\u2665':'hearts','\u2666':'diams','\u266A':'sung','\u2713':'check','\u2717':'cross','\u2720':'malt','\u2736':'sext','\u2758':'VerticalSeparator','\u27C8':'bsolhsub','\u27C9':'suphsol','\u27F5':'xlarr','\u27F6':'xrarr','\u27F7':'xharr','\u27F8':'xlArr','\u27F9':'xrArr','\u27FA':'xhArr','\u27FC':'xmap','\u27FF':'dzigrarr','\u2902':'nvlArr','\u2903':'nvrArr','\u2904':'nvHarr','\u2905':'Map','\u290C':'lbarr','\u290D':'rbarr','\u290E':'lBarr','\u290F':'rBarr','\u2910':'RBarr','\u2911':'DDotrahd','\u2912':'UpArrowBar','\u2913':'DownArrowBar','\u2916':'Rarrtl','\u2919':'latail','\u291A':'ratail','\u291B':'lAtail','\u291C':'rAtail','\u291D':'larrfs','\u291E':'rarrfs','\u291F':'larrbfs','\u2920':'rarrbfs','\u2923':'nwarhk','\u2924':'nearhk','\u2925':'searhk','\u2926':'swarhk','\u2927':'nwnear','\u2928':'toea','\u2929':'tosa','\u292A':'swnwar','\u2933':'rarrc','\u2933\u0338':'nrarrc','\u2935':'cudarrr','\u2936':'ldca','\u2937':'rdca','\u2938':'cudarrl','\u2939':'larrpl','\u293C':'curarrm','\u293D':'cularrp','\u2945':'rarrpl','\u2948':'harrcir','\u2949':'Uarrocir','\u294A':'lurdshar','\u294B':'ldrushar','\u294E':'LeftRightVector','\u294F':'RightUpDownVector','\u2950':'DownLeftRightVector','\u2951':'LeftUpDownVector','\u2952':'LeftVectorBar','\u2953':'RightVectorBar','\u2954':'RightUpVectorBar','\u2955':'RightDownVectorBar','\u2956':'DownLeftVectorBar','\u2957':'DownRightVectorBar','\u2958':'LeftUpVectorBar','\u2959':'LeftDownVectorBar','\u295A':'LeftTeeVector','\u295B':'RightTeeVector','\u295C':'RightUpTeeVector','\u295D':'RightDownTeeVector','\u295E':'DownLeftTeeVector','\u295F':'DownRightTeeVector','\u2960':'LeftUpTeeVector','\u2961':'LeftDownTeeVector','\u2962':'lHar','\u2963':'uHar','\u2964':'rHar','\u2965':'dHar','\u2966':'luruhar','\u2967':'ldrdhar','\u2968':'ruluhar','\u2969':'rdldhar','\u296A':'lharul','\u296B':'llhard','\u296C':'rharul','\u296D':'lrhard','\u296E':'udhar','\u296F':'duhar','\u2970':'RoundImplies','\u2971':'erarr','\u2972':'simrarr','\u2973':'larrsim','\u2974':'rarrsim','\u2975':'rarrap','\u2976':'ltlarr','\u2978':'gtrarr','\u2979':'subrarr','\u297B':'suplarr','\u297C':'lfisht','\u297D':'rfisht','\u297E':'ufisht','\u297F':'dfisht','\u299A':'vzigzag','\u299C':'vangrt','\u299D':'angrtvbd','\u29A4':'ange','\u29A5':'range','\u29A6':'dwangle','\u29A7':'uwangle','\u29A8':'angmsdaa','\u29A9':'angmsdab','\u29AA':'angmsdac','\u29AB':'angmsdad','\u29AC':'angmsdae','\u29AD':'angmsdaf','\u29AE':'angmsdag','\u29AF':'angmsdah','\u29B0':'bemptyv','\u29B1':'demptyv','\u29B2':'cemptyv','\u29B3':'raemptyv','\u29B4':'laemptyv','\u29B5':'ohbar','\u29B6':'omid','\u29B7':'opar','\u29B9':'operp','\u29BB':'olcross','\u29BC':'odsold','\u29BE':'olcir','\u29BF':'ofcir','\u29C0':'olt','\u29C1':'ogt','\u29C2':'cirscir','\u29C3':'cirE','\u29C4':'solb','\u29C5':'bsolb','\u29C9':'boxbox','\u29CD':'trisb','\u29CE':'rtriltri','\u29CF':'LeftTriangleBar','\u29CF\u0338':'NotLeftTriangleBar','\u29D0':'RightTriangleBar','\u29D0\u0338':'NotRightTriangleBar','\u29DC':'iinfin','\u29DD':'infintie','\u29DE':'nvinfin','\u29E3':'eparsl','\u29E4':'smeparsl','\u29E5':'eqvparsl','\u29EB':'lozf','\u29F4':'RuleDelayed','\u29F6':'dsol','\u2A00':'xodot','\u2A01':'xoplus','\u2A02':'xotime','\u2A04':'xuplus','\u2A06':'xsqcup','\u2A0D':'fpartint','\u2A10':'cirfnint','\u2A11':'awint','\u2A12':'rppolint','\u2A13':'scpolint','\u2A14':'npolint','\u2A15':'pointint','\u2A16':'quatint','\u2A17':'intlarhk','\u2A22':'pluscir','\u2A23':'plusacir','\u2A24':'simplus','\u2A25':'plusdu','\u2A26':'plussim','\u2A27':'plustwo','\u2A29':'mcomma','\u2A2A':'minusdu','\u2A2D':'loplus','\u2A2E':'roplus','\u2A2F':'Cross','\u2A30':'timesd','\u2A31':'timesbar','\u2A33':'smashp','\u2A34':'lotimes','\u2A35':'rotimes','\u2A36':'otimesas','\u2A37':'Otimes','\u2A38':'odiv','\u2A39':'triplus','\u2A3A':'triminus','\u2A3B':'tritime','\u2A3C':'iprod','\u2A3F':'amalg','\u2A40':'capdot','\u2A42':'ncup','\u2A43':'ncap','\u2A44':'capand','\u2A45':'cupor','\u2A46':'cupcap','\u2A47':'capcup','\u2A48':'cupbrcap','\u2A49':'capbrcup','\u2A4A':'cupcup','\u2A4B':'capcap','\u2A4C':'ccups','\u2A4D':'ccaps','\u2A50':'ccupssm','\u2A53':'And','\u2A54':'Or','\u2A55':'andand','\u2A56':'oror','\u2A57':'orslope','\u2A58':'andslope','\u2A5A':'andv','\u2A5B':'orv','\u2A5C':'andd','\u2A5D':'ord','\u2A5F':'wedbar','\u2A66':'sdote','\u2A6A':'simdot','\u2A6D':'congdot','\u2A6D\u0338':'ncongdot','\u2A6E':'easter','\u2A6F':'apacir','\u2A70':'apE','\u2A70\u0338':'napE','\u2A71':'eplus','\u2A72':'pluse','\u2A73':'Esim','\u2A77':'eDDot','\u2A78':'equivDD','\u2A79':'ltcir','\u2A7A':'gtcir','\u2A7B':'ltquest','\u2A7C':'gtquest','\u2A7D':'les','\u2A7D\u0338':'nles','\u2A7E':'ges','\u2A7E\u0338':'nges','\u2A7F':'lesdot','\u2A80':'gesdot','\u2A81':'lesdoto','\u2A82':'gesdoto','\u2A83':'lesdotor','\u2A84':'gesdotol','\u2A85':'lap','\u2A86':'gap','\u2A87':'lne','\u2A88':'gne','\u2A89':'lnap','\u2A8A':'gnap','\u2A8B':'lEg','\u2A8C':'gEl','\u2A8D':'lsime','\u2A8E':'gsime','\u2A8F':'lsimg','\u2A90':'gsiml','\u2A91':'lgE','\u2A92':'glE','\u2A93':'lesges','\u2A94':'gesles','\u2A95':'els','\u2A96':'egs','\u2A97':'elsdot','\u2A98':'egsdot','\u2A99':'el','\u2A9A':'eg','\u2A9D':'siml','\u2A9E':'simg','\u2A9F':'simlE','\u2AA0':'simgE','\u2AA1':'LessLess','\u2AA1\u0338':'NotNestedLessLess','\u2AA2':'GreaterGreater','\u2AA2\u0338':'NotNestedGreaterGreater','\u2AA4':'glj','\u2AA5':'gla','\u2AA6':'ltcc','\u2AA7':'gtcc','\u2AA8':'lescc','\u2AA9':'gescc','\u2AAA':'smt','\u2AAB':'lat','\u2AAC':'smte','\u2AAC\uFE00':'smtes','\u2AAD':'late','\u2AAD\uFE00':'lates','\u2AAE':'bumpE','\u2AAF':'pre','\u2AAF\u0338':'npre','\u2AB0':'sce','\u2AB0\u0338':'nsce','\u2AB3':'prE','\u2AB4':'scE','\u2AB5':'prnE','\u2AB6':'scnE','\u2AB7':'prap','\u2AB8':'scap','\u2AB9':'prnap','\u2ABA':'scnap','\u2ABB':'Pr','\u2ABC':'Sc','\u2ABD':'subdot','\u2ABE':'supdot','\u2ABF':'subplus','\u2AC0':'supplus','\u2AC1':'submult','\u2AC2':'supmult','\u2AC3':'subedot','\u2AC4':'supedot','\u2AC5':'subE','\u2AC5\u0338':'nsubE','\u2AC6':'supE','\u2AC6\u0338':'nsupE','\u2AC7':'subsim','\u2AC8':'supsim','\u2ACB\uFE00':'vsubnE','\u2ACB':'subnE','\u2ACC\uFE00':'vsupnE','\u2ACC':'supnE','\u2ACF':'csub','\u2AD0':'csup','\u2AD1':'csube','\u2AD2':'csupe','\u2AD3':'subsup','\u2AD4':'supsub','\u2AD5':'subsub','\u2AD6':'supsup','\u2AD7':'suphsub','\u2AD8':'supdsub','\u2AD9':'forkv','\u2ADA':'topfork','\u2ADB':'mlcp','\u2AE4':'Dashv','\u2AE6':'Vdashl','\u2AE7':'Barv','\u2AE8':'vBar','\u2AE9':'vBarv','\u2AEB':'Vbar','\u2AEC':'Not','\u2AED':'bNot','\u2AEE':'rnmid','\u2AEF':'cirmid','\u2AF0':'midcir','\u2AF1':'topcir','\u2AF2':'nhpar','\u2AF3':'parsim','\u2AFD':'parsl','\u2AFD\u20E5':'nparsl','\u266D':'flat','\u266E':'natur','\u266F':'sharp','\xA4':'curren','\xA2':'cent','$':'dollar','\xA3':'pound','\xA5':'yen','\u20AC':'euro','\xB9':'sup1','\xBD':'half','\u2153':'frac13','\xBC':'frac14','\u2155':'frac15','\u2159':'frac16','\u215B':'frac18','\xB2':'sup2','\u2154':'frac23','\u2156':'frac25','\xB3':'sup3','\xBE':'frac34','\u2157':'frac35','\u215C':'frac38','\u2158':'frac45','\u215A':'frac56','\u215D':'frac58','\u215E':'frac78','\uD835\uDCB6':'ascr','\uD835\uDD52':'aopf','\uD835\uDD1E':'afr','\uD835\uDD38':'Aopf','\uD835\uDD04':'Afr','\uD835\uDC9C':'Ascr','\xAA':'ordf','\xE1':'aacute','\xC1':'Aacute','\xE0':'agrave','\xC0':'Agrave','\u0103':'abreve','\u0102':'Abreve','\xE2':'acirc','\xC2':'Acirc','\xE5':'aring','\xC5':'angst','\xE4':'auml','\xC4':'Auml','\xE3':'atilde','\xC3':'Atilde','\u0105':'aogon','\u0104':'Aogon','\u0101':'amacr','\u0100':'Amacr','\xE6':'aelig','\xC6':'AElig','\uD835\uDCB7':'bscr','\uD835\uDD53':'bopf','\uD835\uDD1F':'bfr','\uD835\uDD39':'Bopf','\u212C':'Bscr','\uD835\uDD05':'Bfr','\uD835\uDD20':'cfr','\uD835\uDCB8':'cscr','\uD835\uDD54':'copf','\u212D':'Cfr','\uD835\uDC9E':'Cscr','\u2102':'Copf','\u0107':'cacute','\u0106':'Cacute','\u0109':'ccirc','\u0108':'Ccirc','\u010D':'ccaron','\u010C':'Ccaron','\u010B':'cdot','\u010A':'Cdot','\xE7':'ccedil','\xC7':'Ccedil','\u2105':'incare','\uD835\uDD21':'dfr','\u2146':'dd','\uD835\uDD55':'dopf','\uD835\uDCB9':'dscr','\uD835\uDC9F':'Dscr','\uD835\uDD07':'Dfr','\u2145':'DD','\uD835\uDD3B':'Dopf','\u010F':'dcaron','\u010E':'Dcaron','\u0111':'dstrok','\u0110':'Dstrok','\xF0':'eth','\xD0':'ETH','\u2147':'ee','\u212F':'escr','\uD835\uDD22':'efr','\uD835\uDD56':'eopf','\u2130':'Escr','\uD835\uDD08':'Efr','\uD835\uDD3C':'Eopf','\xE9':'eacute','\xC9':'Eacute','\xE8':'egrave','\xC8':'Egrave','\xEA':'ecirc','\xCA':'Ecirc','\u011B':'ecaron','\u011A':'Ecaron','\xEB':'euml','\xCB':'Euml','\u0117':'edot','\u0116':'Edot','\u0119':'eogon','\u0118':'Eogon','\u0113':'emacr','\u0112':'Emacr','\uD835\uDD23':'ffr','\uD835\uDD57':'fopf','\uD835\uDCBB':'fscr','\uD835\uDD09':'Ffr','\uD835\uDD3D':'Fopf','\u2131':'Fscr','\uFB00':'fflig','\uFB03':'ffilig','\uFB04':'ffllig','\uFB01':'filig','fj':'fjlig','\uFB02':'fllig','\u0192':'fnof','\u210A':'gscr','\uD835\uDD58':'gopf','\uD835\uDD24':'gfr','\uD835\uDCA2':'Gscr','\uD835\uDD3E':'Gopf','\uD835\uDD0A':'Gfr','\u01F5':'gacute','\u011F':'gbreve','\u011E':'Gbreve','\u011D':'gcirc','\u011C':'Gcirc','\u0121':'gdot','\u0120':'Gdot','\u0122':'Gcedil','\uD835\uDD25':'hfr','\u210E':'planckh','\uD835\uDCBD':'hscr','\uD835\uDD59':'hopf','\u210B':'Hscr','\u210C':'Hfr','\u210D':'Hopf','\u0125':'hcirc','\u0124':'Hcirc','\u210F':'hbar','\u0127':'hstrok','\u0126':'Hstrok','\uD835\uDD5A':'iopf','\uD835\uDD26':'ifr','\uD835\uDCBE':'iscr','\u2148':'ii','\uD835\uDD40':'Iopf','\u2110':'Iscr','\u2111':'Im','\xED':'iacute','\xCD':'Iacute','\xEC':'igrave','\xCC':'Igrave','\xEE':'icirc','\xCE':'Icirc','\xEF':'iuml','\xCF':'Iuml','\u0129':'itilde','\u0128':'Itilde','\u0130':'Idot','\u012F':'iogon','\u012E':'Iogon','\u012B':'imacr','\u012A':'Imacr','\u0133':'ijlig','\u0132':'IJlig','\u0131':'imath','\uD835\uDCBF':'jscr','\uD835\uDD5B':'jopf','\uD835\uDD27':'jfr','\uD835\uDCA5':'Jscr','\uD835\uDD0D':'Jfr','\uD835\uDD41':'Jopf','\u0135':'jcirc','\u0134':'Jcirc','\u0237':'jmath','\uD835\uDD5C':'kopf','\uD835\uDCC0':'kscr','\uD835\uDD28':'kfr','\uD835\uDCA6':'Kscr','\uD835\uDD42':'Kopf','\uD835\uDD0E':'Kfr','\u0137':'kcedil','\u0136':'Kcedil','\uD835\uDD29':'lfr','\uD835\uDCC1':'lscr','\u2113':'ell','\uD835\uDD5D':'lopf','\u2112':'Lscr','\uD835\uDD0F':'Lfr','\uD835\uDD43':'Lopf','\u013A':'lacute','\u0139':'Lacute','\u013E':'lcaron','\u013D':'Lcaron','\u013C':'lcedil','\u013B':'Lcedil','\u0142':'lstrok','\u0141':'Lstrok','\u0140':'lmidot','\u013F':'Lmidot','\uD835\uDD2A':'mfr','\uD835\uDD5E':'mopf','\uD835\uDCC2':'mscr','\uD835\uDD10':'Mfr','\uD835\uDD44':'Mopf','\u2133':'Mscr','\uD835\uDD2B':'nfr','\uD835\uDD5F':'nopf','\uD835\uDCC3':'nscr','\u2115':'Nopf','\uD835\uDCA9':'Nscr','\uD835\uDD11':'Nfr','\u0144':'nacute','\u0143':'Nacute','\u0148':'ncaron','\u0147':'Ncaron','\xF1':'ntilde','\xD1':'Ntilde','\u0146':'ncedil','\u0145':'Ncedil','\u2116':'numero','\u014B':'eng','\u014A':'ENG','\uD835\uDD60':'oopf','\uD835\uDD2C':'ofr','\u2134':'oscr','\uD835\uDCAA':'Oscr','\uD835\uDD12':'Ofr','\uD835\uDD46':'Oopf','\xBA':'ordm','\xF3':'oacute','\xD3':'Oacute','\xF2':'ograve','\xD2':'Ograve','\xF4':'ocirc','\xD4':'Ocirc','\xF6':'ouml','\xD6':'Ouml','\u0151':'odblac','\u0150':'Odblac','\xF5':'otilde','\xD5':'Otilde','\xF8':'oslash','\xD8':'Oslash','\u014D':'omacr','\u014C':'Omacr','\u0153':'oelig','\u0152':'OElig','\uD835\uDD2D':'pfr','\uD835\uDCC5':'pscr','\uD835\uDD61':'popf','\u2119':'Popf','\uD835\uDD13':'Pfr','\uD835\uDCAB':'Pscr','\uD835\uDD62':'qopf','\uD835\uDD2E':'qfr','\uD835\uDCC6':'qscr','\uD835\uDCAC':'Qscr','\uD835\uDD14':'Qfr','\u211A':'Qopf','\u0138':'kgreen','\uD835\uDD2F':'rfr','\uD835\uDD63':'ropf','\uD835\uDCC7':'rscr','\u211B':'Rscr','\u211C':'Re','\u211D':'Ropf','\u0155':'racute','\u0154':'Racute','\u0159':'rcaron','\u0158':'Rcaron','\u0157':'rcedil','\u0156':'Rcedil','\uD835\uDD64':'sopf','\uD835\uDCC8':'sscr','\uD835\uDD30':'sfr','\uD835\uDD4A':'Sopf','\uD835\uDD16':'Sfr','\uD835\uDCAE':'Sscr','\u24C8':'oS','\u015B':'sacute','\u015A':'Sacute','\u015D':'scirc','\u015C':'Scirc','\u0161':'scaron','\u0160':'Scaron','\u015F':'scedil','\u015E':'Scedil','\xDF':'szlig','\uD835\uDD31':'tfr','\uD835\uDCC9':'tscr','\uD835\uDD65':'topf','\uD835\uDCAF':'Tscr','\uD835\uDD17':'Tfr','\uD835\uDD4B':'Topf','\u0165':'tcaron','\u0164':'Tcaron','\u0163':'tcedil','\u0162':'Tcedil','\u2122':'trade','\u0167':'tstrok','\u0166':'Tstrok','\uD835\uDCCA':'uscr','\uD835\uDD66':'uopf','\uD835\uDD32':'ufr','\uD835\uDD4C':'Uopf','\uD835\uDD18':'Ufr','\uD835\uDCB0':'Uscr','\xFA':'uacute','\xDA':'Uacute','\xF9':'ugrave','\xD9':'Ugrave','\u016D':'ubreve','\u016C':'Ubreve','\xFB':'ucirc','\xDB':'Ucirc','\u016F':'uring','\u016E':'Uring','\xFC':'uuml','\xDC':'Uuml','\u0171':'udblac','\u0170':'Udblac','\u0169':'utilde','\u0168':'Utilde','\u0173':'uogon','\u0172':'Uogon','\u016B':'umacr','\u016A':'Umacr','\uD835\uDD33':'vfr','\uD835\uDD67':'vopf','\uD835\uDCCB':'vscr','\uD835\uDD19':'Vfr','\uD835\uDD4D':'Vopf','\uD835\uDCB1':'Vscr','\uD835\uDD68':'wopf','\uD835\uDCCC':'wscr','\uD835\uDD34':'wfr','\uD835\uDCB2':'Wscr','\uD835\uDD4E':'Wopf','\uD835\uDD1A':'Wfr','\u0175':'wcirc','\u0174':'Wcirc','\uD835\uDD35':'xfr','\uD835\uDCCD':'xscr','\uD835\uDD69':'xopf','\uD835\uDD4F':'Xopf','\uD835\uDD1B':'Xfr','\uD835\uDCB3':'Xscr','\uD835\uDD36':'yfr','\uD835\uDCCE':'yscr','\uD835\uDD6A':'yopf','\uD835\uDCB4':'Yscr','\uD835\uDD1C':'Yfr','\uD835\uDD50':'Yopf','\xFD':'yacute','\xDD':'Yacute','\u0177':'ycirc','\u0176':'Ycirc','\xFF':'yuml','\u0178':'Yuml','\uD835\uDCCF':'zscr','\uD835\uDD37':'zfr','\uD835\uDD6B':'zopf','\u2128':'Zfr','\u2124':'Zopf','\uD835\uDCB5':'Zscr','\u017A':'zacute','\u0179':'Zacute','\u017E':'zcaron','\u017D':'Zcaron','\u017C':'zdot','\u017B':'Zdot','\u01B5':'imped','\xFE':'thorn','\xDE':'THORN','\u0149':'napos','\u03B1':'alpha','\u0391':'Alpha','\u03B2':'beta','\u0392':'Beta','\u03B3':'gamma','\u0393':'Gamma','\u03B4':'delta','\u0394':'Delta','\u03B5':'epsi','\u03F5':'epsiv','\u0395':'Epsilon','\u03DD':'gammad','\u03DC':'Gammad','\u03B6':'zeta','\u0396':'Zeta','\u03B7':'eta','\u0397':'Eta','\u03B8':'theta','\u03D1':'thetav','\u0398':'Theta','\u03B9':'iota','\u0399':'Iota','\u03BA':'kappa','\u03F0':'kappav','\u039A':'Kappa','\u03BB':'lambda','\u039B':'Lambda','\u03BC':'mu','\xB5':'micro','\u039C':'Mu','\u03BD':'nu','\u039D':'Nu','\u03BE':'xi','\u039E':'Xi','\u03BF':'omicron','\u039F':'Omicron','\u03C0':'pi','\u03D6':'piv','\u03A0':'Pi','\u03C1':'rho','\u03F1':'rhov','\u03A1':'Rho','\u03C3':'sigma','\u03A3':'Sigma','\u03C2':'sigmaf','\u03C4':'tau','\u03A4':'Tau','\u03C5':'upsi','\u03A5':'Upsilon','\u03D2':'Upsi','\u03C6':'phi','\u03D5':'phiv','\u03A6':'Phi','\u03C7':'chi','\u03A7':'Chi','\u03C8':'psi','\u03A8':'Psi','\u03C9':'omega','\u03A9':'ohm','\u0430':'acy','\u0410':'Acy','\u0431':'bcy','\u0411':'Bcy','\u0432':'vcy','\u0412':'Vcy','\u0433':'gcy','\u0413':'Gcy','\u0453':'gjcy','\u0403':'GJcy','\u0434':'dcy','\u0414':'Dcy','\u0452':'djcy','\u0402':'DJcy','\u0435':'iecy','\u0415':'IEcy','\u0451':'iocy','\u0401':'IOcy','\u0454':'jukcy','\u0404':'Jukcy','\u0436':'zhcy','\u0416':'ZHcy','\u0437':'zcy','\u0417':'Zcy','\u0455':'dscy','\u0405':'DScy','\u0438':'icy','\u0418':'Icy','\u0456':'iukcy','\u0406':'Iukcy','\u0457':'yicy','\u0407':'YIcy','\u0439':'jcy','\u0419':'Jcy','\u0458':'jsercy','\u0408':'Jsercy','\u043A':'kcy','\u041A':'Kcy','\u045C':'kjcy','\u040C':'KJcy','\u043B':'lcy','\u041B':'Lcy','\u0459':'ljcy','\u0409':'LJcy','\u043C':'mcy','\u041C':'Mcy','\u043D':'ncy','\u041D':'Ncy','\u045A':'njcy','\u040A':'NJcy','\u043E':'ocy','\u041E':'Ocy','\u043F':'pcy','\u041F':'Pcy','\u0440':'rcy','\u0420':'Rcy','\u0441':'scy','\u0421':'Scy','\u0442':'tcy','\u0422':'Tcy','\u045B':'tshcy','\u040B':'TSHcy','\u0443':'ucy','\u0423':'Ucy','\u045E':'ubrcy','\u040E':'Ubrcy','\u0444':'fcy','\u0424':'Fcy','\u0445':'khcy','\u0425':'KHcy','\u0446':'tscy','\u0426':'TScy','\u0447':'chcy','\u0427':'CHcy','\u045F':'dzcy','\u040F':'DZcy','\u0448':'shcy','\u0428':'SHcy','\u0449':'shchcy','\u0429':'SHCHcy','\u044A':'hardcy','\u042A':'HARDcy','\u044B':'ycy','\u042B':'Ycy','\u044C':'softcy','\u042C':'SOFTcy','\u044D':'ecy','\u042D':'Ecy','\u044E':'yucy','\u042E':'YUcy','\u044F':'yacy','\u042F':'YAcy','\u2135':'aleph','\u2136':'beth','\u2137':'gimel','\u2138':'daleth'};

	var regexEscape = /["&'<>`]/g;
	var escapeMap = {
		'"': '&quot;',
		'&': '&amp;',
		'\'': '&#x27;',
		'<': '&lt;',
		// See https://mathiasbynens.be/notes/ambiguous-ampersands: in HTML, the
		// following is not strictly necessary unless it’s part of a tag or an
		// unquoted attribute value. We’re only escaping it to support those
		// situations, and for XML support.
		'>': '&gt;',
		// In Internet Explorer ≤ 8, the backtick character can be used
		// to break out of (un)quoted attribute values or HTML comments.
		// See http://html5sec.org/#102, http://html5sec.org/#108, and
		// http://html5sec.org/#133.
		'`': '&#x60;'
	};

	var regexInvalidEntity = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
	var regexInvalidRawCodePoint = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
	var regexDecode = /&(CounterClockwiseContourIntegral|DoubleLongLeftRightArrow|ClockwiseContourIntegral|NotNestedGreaterGreater|NotSquareSupersetEqual|DiacriticalDoubleAcute|NotRightTriangleEqual|NotSucceedsSlantEqual|NotPrecedesSlantEqual|CloseCurlyDoubleQuote|NegativeVeryThinSpace|DoubleContourIntegral|FilledVerySmallSquare|CapitalDifferentialD|OpenCurlyDoubleQuote|EmptyVerySmallSquare|NestedGreaterGreater|DoubleLongRightArrow|NotLeftTriangleEqual|NotGreaterSlantEqual|ReverseUpEquilibrium|DoubleLeftRightArrow|NotSquareSubsetEqual|NotDoubleVerticalBar|RightArrowLeftArrow|NotGreaterFullEqual|NotRightTriangleBar|SquareSupersetEqual|DownLeftRightVector|DoubleLongLeftArrow|leftrightsquigarrow|LeftArrowRightArrow|NegativeMediumSpace|blacktriangleright|RightDownVectorBar|PrecedesSlantEqual|RightDoubleBracket|SucceedsSlantEqual|NotLeftTriangleBar|RightTriangleEqual|SquareIntersection|RightDownTeeVector|ReverseEquilibrium|NegativeThickSpace|longleftrightarrow|Longleftrightarrow|LongLeftRightArrow|DownRightTeeVector|DownRightVectorBar|GreaterSlantEqual|SquareSubsetEqual|LeftDownVectorBar|LeftDoubleBracket|VerticalSeparator|rightleftharpoons|NotGreaterGreater|NotSquareSuperset|blacktriangleleft|blacktriangledown|NegativeThinSpace|LeftDownTeeVector|NotLessSlantEqual|leftrightharpoons|DoubleUpDownArrow|DoubleVerticalBar|LeftTriangleEqual|FilledSmallSquare|twoheadrightarrow|NotNestedLessLess|DownLeftTeeVector|DownLeftVectorBar|RightAngleBracket|NotTildeFullEqual|NotReverseElement|RightUpDownVector|DiacriticalTilde|NotSucceedsTilde|circlearrowright|NotPrecedesEqual|rightharpoondown|DoubleRightArrow|NotSucceedsEqual|NonBreakingSpace|NotRightTriangle|LessEqualGreater|RightUpTeeVector|LeftAngleBracket|GreaterFullEqual|DownArrowUpArrow|RightUpVectorBar|twoheadleftarrow|GreaterEqualLess|downharpoonright|RightTriangleBar|ntrianglerighteq|NotSupersetEqual|LeftUpDownVector|DiacriticalAcute|rightrightarrows|vartriangleright|UpArrowDownArrow|DiacriticalGrave|UnderParenthesis|EmptySmallSquare|LeftUpVectorBar|leftrightarrows|DownRightVector|downharpoonleft|trianglerighteq|ShortRightArrow|OverParenthesis|DoubleLeftArrow|DoubleDownArrow|NotSquareSubset|bigtriangledown|ntrianglelefteq|UpperRightArrow|curvearrowright|vartriangleleft|NotLeftTriangle|nleftrightarrow|LowerRightArrow|NotHumpDownHump|NotGreaterTilde|rightthreetimes|LeftUpTeeVector|NotGreaterEqual|straightepsilon|LeftTriangleBar|rightsquigarrow|ContourIntegral|rightleftarrows|CloseCurlyQuote|RightDownVector|LeftRightVector|nLeftrightarrow|leftharpoondown|circlearrowleft|SquareSuperset|OpenCurlyQuote|hookrightarrow|HorizontalLine|DiacriticalDot|NotLessGreater|ntriangleright|DoubleRightTee|InvisibleComma|InvisibleTimes|LowerLeftArrow|DownLeftVector|NotSubsetEqual|curvearrowleft|trianglelefteq|NotVerticalBar|TildeFullEqual|downdownarrows|NotGreaterLess|RightTeeVector|ZeroWidthSpace|looparrowright|LongRightArrow|doublebarwedge|ShortLeftArrow|ShortDownArrow|RightVectorBar|GreaterGreater|ReverseElement|rightharpoonup|LessSlantEqual|leftthreetimes|upharpoonright|rightarrowtail|LeftDownVector|Longrightarrow|NestedLessLess|UpperLeftArrow|nshortparallel|leftleftarrows|leftrightarrow|Leftrightarrow|LeftRightArrow|longrightarrow|upharpoonleft|RightArrowBar|ApplyFunction|LeftTeeVector|leftarrowtail|NotEqualTilde|varsubsetneqq|varsupsetneqq|RightTeeArrow|SucceedsEqual|SucceedsTilde|LeftVectorBar|SupersetEqual|hookleftarrow|DifferentialD|VerticalTilde|VeryThinSpace|blacktriangle|bigtriangleup|LessFullEqual|divideontimes|leftharpoonup|UpEquilibrium|ntriangleleft|RightTriangle|measuredangle|shortparallel|longleftarrow|Longleftarrow|LongLeftArrow|DoubleLeftTee|Poincareplane|PrecedesEqual|triangleright|DoubleUpArrow|RightUpVector|fallingdotseq|looparrowleft|PrecedesTilde|NotTildeEqual|NotTildeTilde|smallsetminus|Proportional|triangleleft|triangledown|UnderBracket|NotHumpEqual|exponentiale|ExponentialE|NotLessTilde|HilbertSpace|RightCeiling|blacklozenge|varsupsetneq|HumpDownHump|GreaterEqual|VerticalLine|LeftTeeArrow|NotLessEqual|DownTeeArrow|LeftTriangle|varsubsetneq|Intersection|NotCongruent|DownArrowBar|LeftUpVector|LeftArrowBar|risingdotseq|GreaterTilde|RoundImplies|SquareSubset|ShortUpArrow|NotSuperset|quaternions|precnapprox|backepsilon|preccurlyeq|OverBracket|blacksquare|MediumSpace|VerticalBar|circledcirc|circleddash|CircleMinus|CircleTimes|LessGreater|curlyeqprec|curlyeqsucc|diamondsuit|UpDownArrow|Updownarrow|RuleDelayed|Rrightarrow|updownarrow|RightVector|nRightarrow|nrightarrow|eqslantless|LeftCeiling|Equilibrium|SmallCircle|expectation|NotSucceeds|thickapprox|GreaterLess|SquareUnion|NotPrecedes|NotLessLess|straightphi|succnapprox|succcurlyeq|SubsetEqual|sqsupseteq|Proportion|Laplacetrf|ImaginaryI|supsetneqq|NotGreater|gtreqqless|NotElement|ThickSpace|TildeEqual|TildeTilde|Fouriertrf|rmoustache|EqualTilde|eqslantgtr|UnderBrace|LeftVector|UpArrowBar|nLeftarrow|nsubseteqq|subsetneqq|nsupseteqq|nleftarrow|succapprox|lessapprox|UpTeeArrow|upuparrows|curlywedge|lesseqqgtr|varepsilon|varnothing|RightFloor|complement|CirclePlus|sqsubseteq|Lleftarrow|circledast|RightArrow|Rightarrow|rightarrow|lmoustache|Bernoullis|precapprox|mapstoleft|mapstodown|longmapsto|dotsquare|downarrow|DoubleDot|nsubseteq|supsetneq|leftarrow|nsupseteq|subsetneq|ThinSpace|ngeqslant|subseteqq|HumpEqual|NotSubset|triangleq|NotCupCap|lesseqgtr|heartsuit|TripleDot|Leftarrow|Coproduct|Congruent|varpropto|complexes|gvertneqq|LeftArrow|LessTilde|supseteqq|MinusPlus|CircleDot|nleqslant|NotExists|gtreqless|nparallel|UnionPlus|LeftFloor|checkmark|CenterDot|centerdot|Mellintrf|gtrapprox|bigotimes|OverBrace|spadesuit|therefore|pitchfork|rationals|PlusMinus|Backslash|Therefore|DownBreve|backsimeq|backprime|DownArrow|nshortmid|Downarrow|lvertneqq|eqvparsl|imagline|imagpart|infintie|integers|Integral|intercal|LessLess|Uarrocir|intlarhk|sqsupset|angmsdaf|sqsubset|llcorner|vartheta|cupbrcap|lnapprox|Superset|SuchThat|succnsim|succneqq|angmsdag|biguplus|curlyvee|trpezium|Succeeds|NotTilde|bigwedge|angmsdah|angrtvbd|triminus|cwconint|fpartint|lrcorner|smeparsl|subseteq|urcorner|lurdshar|laemptyv|DDotrahd|approxeq|ldrushar|awconint|mapstoup|backcong|shortmid|triangle|geqslant|gesdotol|timesbar|circledR|circledS|setminus|multimap|naturals|scpolint|ncongdot|RightTee|boxminus|gnapprox|boxtimes|andslope|thicksim|angmsdaa|varsigma|cirfnint|rtriltri|angmsdab|rppolint|angmsdac|barwedge|drbkarow|clubsuit|thetasym|bsolhsub|capbrcup|dzigrarr|doteqdot|DotEqual|dotminus|UnderBar|NotEqual|realpart|otimesas|ulcorner|hksearow|hkswarow|parallel|PartialD|elinters|emptyset|plusacir|bbrktbrk|angmsdad|pointint|bigoplus|angmsdae|Precedes|bigsqcup|varkappa|notindot|supseteq|precneqq|precnsim|profalar|profline|profsurf|leqslant|lesdotor|raemptyv|subplus|notnivb|notnivc|subrarr|zigrarr|vzigzag|submult|subedot|Element|between|cirscir|larrbfs|larrsim|lotimes|lbrksld|lbrkslu|lozenge|ldrdhar|dbkarow|bigcirc|epsilon|simrarr|simplus|ltquest|Epsilon|luruhar|gtquest|maltese|npolint|eqcolon|npreceq|bigodot|ddagger|gtrless|bnequiv|harrcir|ddotseq|equivDD|backsim|demptyv|nsqsube|nsqsupe|Upsilon|nsubset|upsilon|minusdu|nsucceq|swarrow|nsupset|coloneq|searrow|boxplus|napprox|natural|asympeq|alefsym|congdot|nearrow|bigstar|diamond|supplus|tritime|LeftTee|nvinfin|triplus|NewLine|nvltrie|nvrtrie|nwarrow|nexists|Diamond|ruluhar|Implies|supmult|angzarr|suplarr|suphsub|questeq|because|digamma|Because|olcross|bemptyv|omicron|Omicron|rotimes|NoBreak|intprod|angrtvb|orderof|uwangle|suphsol|lesdoto|orslope|DownTee|realine|cudarrl|rdldhar|OverBar|supedot|lessdot|supdsub|topfork|succsim|rbrkslu|rbrksld|pertenk|cudarrr|isindot|planckh|lessgtr|pluscir|gesdoto|plussim|plustwo|lesssim|cularrp|rarrsim|Cayleys|notinva|notinvb|notinvc|UpArrow|Uparrow|uparrow|NotLess|dwangle|precsim|Product|curarrm|Cconint|dotplus|rarrbfs|ccupssm|Cedilla|cemptyv|notniva|quatint|frac35|frac38|frac45|frac56|frac58|frac78|tridot|xoplus|gacute|gammad|Gammad|lfisht|lfloor|bigcup|sqsupe|gbreve|Gbreve|lharul|sqsube|sqcups|Gcedil|apacir|llhard|lmidot|Lmidot|lmoust|andand|sqcaps|approx|Abreve|spades|circeq|tprime|divide|topcir|Assign|topbot|gesdot|divonx|xuplus|timesd|gesles|atilde|solbar|SOFTcy|loplus|timesb|lowast|lowbar|dlcorn|dlcrop|softcy|dollar|lparlt|thksim|lrhard|Atilde|lsaquo|smashp|bigvee|thinsp|wreath|bkarow|lsquor|lstrok|Lstrok|lthree|ltimes|ltlarr|DotDot|simdot|ltrPar|weierp|xsqcup|angmsd|sigmav|sigmaf|zeetrf|Zcaron|zcaron|mapsto|vsupne|thetav|cirmid|marker|mcomma|Zacute|vsubnE|there4|gtlPar|vsubne|bottom|gtrarr|SHCHcy|shchcy|midast|midcir|middot|minusb|minusd|gtrdot|bowtie|sfrown|mnplus|models|colone|seswar|Colone|mstpos|searhk|gtrsim|nacute|Nacute|boxbox|telrec|hairsp|Tcedil|nbumpe|scnsim|ncaron|Ncaron|ncedil|Ncedil|hamilt|Scedil|nearhk|hardcy|HARDcy|tcedil|Tcaron|commat|nequiv|nesear|tcaron|target|hearts|nexist|varrho|scedil|Scaron|scaron|hellip|Sacute|sacute|hercon|swnwar|compfn|rtimes|rthree|rsquor|rsaquo|zacute|wedgeq|homtht|barvee|barwed|Barwed|rpargt|horbar|conint|swarhk|roplus|nltrie|hslash|hstrok|Hstrok|rmoust|Conint|bprime|hybull|hyphen|iacute|Iacute|supsup|supsub|supsim|varphi|coprod|brvbar|agrave|Supset|supset|igrave|Igrave|notinE|Agrave|iiiint|iinfin|copysr|wedbar|Verbar|vangrt|becaus|incare|verbar|inodot|bullet|drcorn|intcal|drcrop|cularr|vellip|Utilde|bumpeq|cupcap|dstrok|Dstrok|CupCap|cupcup|cupdot|eacute|Eacute|supdot|iquest|easter|ecaron|Ecaron|ecolon|isinsv|utilde|itilde|Itilde|curarr|succeq|Bumpeq|cacute|ulcrop|nparsl|Cacute|nprcue|egrave|Egrave|nrarrc|nrarrw|subsup|subsub|nrtrie|jsercy|nsccue|Jsercy|kappav|kcedil|Kcedil|subsim|ulcorn|nsimeq|egsdot|veebar|kgreen|capand|elsdot|Subset|subset|curren|aacute|lacute|Lacute|emptyv|ntilde|Ntilde|lagran|lambda|Lambda|capcap|Ugrave|langle|subdot|emsp13|numero|emsp14|nvdash|nvDash|nVdash|nVDash|ugrave|ufisht|nvHarr|larrfs|nvlArr|larrhk|larrlp|larrpl|nvrArr|Udblac|nwarhk|larrtl|nwnear|oacute|Oacute|latail|lAtail|sstarf|lbrace|odblac|Odblac|lbrack|udblac|odsold|eparsl|lcaron|Lcaron|ograve|Ograve|lcedil|Lcedil|Aacute|ssmile|ssetmn|squarf|ldquor|capcup|ominus|cylcty|rharul|eqcirc|dagger|rfloor|rfisht|Dagger|daleth|equals|origof|capdot|equest|dcaron|Dcaron|rdquor|oslash|Oslash|otilde|Otilde|otimes|Otimes|urcrop|Ubreve|ubreve|Yacute|Uacute|uacute|Rcedil|rcedil|urcorn|parsim|Rcaron|Vdashl|rcaron|Tstrok|percnt|period|permil|Exists|yacute|rbrack|rbrace|phmmat|ccaron|Ccaron|planck|ccedil|plankv|tstrok|female|plusdo|plusdu|ffilig|plusmn|ffllig|Ccedil|rAtail|dfisht|bernou|ratail|Rarrtl|rarrtl|angsph|rarrpl|rarrlp|rarrhk|xwedge|xotime|forall|ForAll|Vvdash|vsupnE|preceq|bigcap|frac12|frac13|frac14|primes|rarrfs|prnsim|frac15|Square|frac16|square|lesdot|frac18|frac23|propto|prurel|rarrap|rangle|puncsp|frac25|Racute|qprime|racute|lesges|frac34|abreve|AElig|eqsim|utdot|setmn|urtri|Equal|Uring|seArr|uring|searr|dashv|Dashv|mumap|nabla|iogon|Iogon|sdote|sdotb|scsim|napid|napos|equiv|natur|Acirc|dblac|erarr|nbump|iprod|erDot|ucirc|awint|esdot|angrt|ncong|isinE|scnap|Scirc|scirc|ndash|isins|Ubrcy|nearr|neArr|isinv|nedot|ubrcy|acute|Ycirc|iukcy|Iukcy|xutri|nesim|caret|jcirc|Jcirc|caron|twixt|ddarr|sccue|exist|jmath|sbquo|ngeqq|angst|ccaps|lceil|ngsim|UpTee|delta|Delta|rtrif|nharr|nhArr|nhpar|rtrie|jukcy|Jukcy|kappa|rsquo|Kappa|nlarr|nlArr|TSHcy|rrarr|aogon|Aogon|fflig|xrarr|tshcy|ccirc|nleqq|filig|upsih|nless|dharl|nlsim|fjlig|ropar|nltri|dharr|robrk|roarr|fllig|fltns|roang|rnmid|subnE|subne|lAarr|trisb|Ccirc|acirc|ccups|blank|VDash|forkv|Vdash|langd|cedil|blk12|blk14|laquo|strns|diams|notin|vDash|larrb|blk34|block|disin|uplus|vdash|vBarv|aelig|starf|Wedge|check|xrArr|lates|lbarr|lBarr|notni|lbbrk|bcong|frasl|lbrke|frown|vrtri|vprop|vnsup|gamma|Gamma|wedge|xodot|bdquo|srarr|doteq|ldquo|boxdl|boxdL|gcirc|Gcirc|boxDl|boxDL|boxdr|boxdR|boxDr|TRADE|trade|rlhar|boxDR|vnsub|npart|vltri|rlarr|boxhd|boxhD|nprec|gescc|nrarr|nrArr|boxHd|boxHD|boxhu|boxhU|nrtri|boxHu|clubs|boxHU|times|colon|Colon|gimel|xlArr|Tilde|nsime|tilde|nsmid|nspar|THORN|thorn|xlarr|nsube|nsubE|thkap|xhArr|comma|nsucc|boxul|boxuL|nsupe|nsupE|gneqq|gnsim|boxUl|boxUL|grave|boxur|boxuR|boxUr|boxUR|lescc|angle|bepsi|boxvh|varpi|boxvH|numsp|Theta|gsime|gsiml|theta|boxVh|boxVH|boxvl|gtcir|gtdot|boxvL|boxVl|boxVL|crarr|cross|Cross|nvsim|boxvr|nwarr|nwArr|sqsup|dtdot|Uogon|lhard|lharu|dtrif|ocirc|Ocirc|lhblk|duarr|odash|sqsub|Hacek|sqcup|llarr|duhar|oelig|OElig|ofcir|boxvR|uogon|lltri|boxVr|csube|uuarr|ohbar|csupe|ctdot|olarr|olcir|harrw|oline|sqcap|omacr|Omacr|omega|Omega|boxVR|aleph|lneqq|lnsim|loang|loarr|rharu|lobrk|hcirc|operp|oplus|rhard|Hcirc|orarr|Union|order|ecirc|Ecirc|cuepr|szlig|cuesc|breve|reals|eDDot|Breve|hoarr|lopar|utrif|rdquo|Umacr|umacr|efDot|swArr|ultri|alpha|rceil|ovbar|swarr|Wcirc|wcirc|smtes|smile|bsemi|lrarr|aring|parsl|lrhar|bsime|uhblk|lrtri|cupor|Aring|uharr|uharl|slarr|rbrke|bsolb|lsime|rbbrk|RBarr|lsimg|phone|rBarr|rbarr|icirc|lsquo|Icirc|emacr|Emacr|ratio|simne|plusb|simlE|simgE|simeq|pluse|ltcir|ltdot|empty|xharr|xdtri|iexcl|Alpha|ltrie|rarrw|pound|ltrif|xcirc|bumpe|prcue|bumpE|asymp|amacr|cuvee|Sigma|sigma|iiint|udhar|iiota|ijlig|IJlig|supnE|imacr|Imacr|prime|Prime|image|prnap|eogon|Eogon|rarrc|mdash|mDDot|cuwed|imath|supne|imped|Amacr|udarr|prsim|micro|rarrb|cwint|raquo|infin|eplus|range|rangd|Ucirc|radic|minus|amalg|veeeq|rAarr|epsiv|ycirc|quest|sharp|quot|zwnj|Qscr|race|qscr|Qopf|qopf|qint|rang|Rang|Zscr|zscr|Zopf|zopf|rarr|rArr|Rarr|Pscr|pscr|prop|prod|prnE|prec|ZHcy|zhcy|prap|Zeta|zeta|Popf|popf|Zdot|plus|zdot|Yuml|yuml|phiv|YUcy|yucy|Yscr|yscr|perp|Yopf|yopf|part|para|YIcy|Ouml|rcub|yicy|YAcy|rdca|ouml|osol|Oscr|rdsh|yacy|real|oscr|xvee|andd|rect|andv|Xscr|oror|ordm|ordf|xscr|ange|aopf|Aopf|rHar|Xopf|opar|Oopf|xopf|xnis|rhov|oopf|omid|xmap|oint|apid|apos|ogon|ascr|Ascr|odot|odiv|xcup|xcap|ocir|oast|nvlt|nvle|nvgt|nvge|nvap|Wscr|wscr|auml|ntlg|ntgl|nsup|nsub|nsim|Nscr|nscr|nsce|Wopf|ring|npre|wopf|npar|Auml|Barv|bbrk|Nopf|nopf|nmid|nLtv|beta|ropf|Ropf|Beta|beth|nles|rpar|nleq|bnot|bNot|nldr|NJcy|rscr|Rscr|Vscr|vscr|rsqb|njcy|bopf|nisd|Bopf|rtri|Vopf|nGtv|ngtr|vopf|boxh|boxH|boxv|nges|ngeq|boxV|bscr|scap|Bscr|bsim|Vert|vert|bsol|bull|bump|caps|cdot|ncup|scnE|ncap|nbsp|napE|Cdot|cent|sdot|Vbar|nang|vBar|chcy|Mscr|mscr|sect|semi|CHcy|Mopf|mopf|sext|circ|cire|mldr|mlcp|cirE|comp|shcy|SHcy|vArr|varr|cong|copf|Copf|copy|COPY|malt|male|macr|lvnE|cscr|ltri|sime|ltcc|simg|Cscr|siml|csub|Uuml|lsqb|lsim|uuml|csup|Lscr|lscr|utri|smid|lpar|cups|smte|lozf|darr|Lopf|Uscr|solb|lopf|sopf|Sopf|lneq|uscr|spar|dArr|lnap|Darr|dash|Sqrt|LJcy|ljcy|lHar|dHar|Upsi|upsi|diam|lesg|djcy|DJcy|leqq|dopf|Dopf|dscr|Dscr|dscy|ldsh|ldca|squf|DScy|sscr|Sscr|dsol|lcub|late|star|Star|Uopf|Larr|lArr|larr|uopf|dtri|dzcy|sube|subE|Lang|lang|Kscr|kscr|Kopf|kopf|KJcy|kjcy|KHcy|khcy|DZcy|ecir|edot|eDot|Jscr|jscr|succ|Jopf|jopf|Edot|uHar|emsp|ensp|Iuml|iuml|eopf|isin|Iscr|iscr|Eopf|epar|sung|epsi|escr|sup1|sup2|sup3|Iota|iota|supe|supE|Iopf|iopf|IOcy|iocy|Escr|esim|Esim|imof|Uarr|QUOT|uArr|uarr|euml|IEcy|iecy|Idot|Euml|euro|excl|Hscr|hscr|Hopf|hopf|TScy|tscy|Tscr|hbar|tscr|flat|tbrk|fnof|hArr|harr|half|fopf|Fopf|tdot|gvnE|fork|trie|gtcc|fscr|Fscr|gdot|gsim|Gscr|gscr|Gopf|gopf|gneq|Gdot|tosa|gnap|Topf|topf|geqq|toea|GJcy|gjcy|tint|gesl|mid|Sfr|ggg|top|ges|gla|glE|glj|geq|gne|gEl|gel|gnE|Gcy|gcy|gap|Tfr|tfr|Tcy|tcy|Hat|Tau|Ffr|tau|Tab|hfr|Hfr|ffr|Fcy|fcy|icy|Icy|iff|ETH|eth|ifr|Ifr|Eta|eta|int|Int|Sup|sup|ucy|Ucy|Sum|sum|jcy|ENG|ufr|Ufr|eng|Jcy|jfr|els|ell|egs|Efr|efr|Jfr|uml|kcy|Kcy|Ecy|ecy|kfr|Kfr|lap|Sub|sub|lat|lcy|Lcy|leg|Dot|dot|lEg|leq|les|squ|div|die|lfr|Lfr|lgE|Dfr|dfr|Del|deg|Dcy|dcy|lne|lnE|sol|loz|smt|Cup|lrm|cup|lsh|Lsh|sim|shy|map|Map|mcy|Mcy|mfr|Mfr|mho|gfr|Gfr|sfr|cir|Chi|chi|nap|Cfr|vcy|Vcy|cfr|Scy|scy|ncy|Ncy|vee|Vee|Cap|cap|nfr|scE|sce|Nfr|nge|ngE|nGg|vfr|Vfr|ngt|bot|nGt|nis|niv|Rsh|rsh|nle|nlE|bne|Bfr|bfr|nLl|nlt|nLt|Bcy|bcy|not|Not|rlm|wfr|Wfr|npr|nsc|num|ocy|ast|Ocy|ofr|xfr|Xfr|Ofr|ogt|ohm|apE|olt|Rho|ape|rho|Rfr|rfr|ord|REG|ang|reg|orv|And|and|AMP|Rcy|amp|Afr|ycy|Ycy|yen|yfr|Yfr|rcy|par|pcy|Pcy|pfr|Pfr|phi|Phi|afr|Acy|acy|zcy|Zcy|piv|acE|acd|zfr|Zfr|pre|prE|psi|Psi|qfr|Qfr|zwj|Or|ge|Gg|gt|gg|el|oS|lt|Lt|LT|Re|lg|gl|eg|ne|Im|it|le|DD|wp|wr|nu|Nu|dd|lE|Sc|sc|pi|Pi|ee|af|ll|Ll|rx|gE|xi|pm|Xi|ic|pr|Pr|in|ni|mp|mu|ac|Mu|or|ap|Gt|GT|ii);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)(?!;)([=a-zA-Z0-9]?)|&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+)/g;
	var decodeMap = {'aacute':'\xE1','Aacute':'\xC1','abreve':'\u0103','Abreve':'\u0102','ac':'\u223E','acd':'\u223F','acE':'\u223E\u0333','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','acy':'\u0430','Acy':'\u0410','aelig':'\xE6','AElig':'\xC6','af':'\u2061','afr':'\uD835\uDD1E','Afr':'\uD835\uDD04','agrave':'\xE0','Agrave':'\xC0','alefsym':'\u2135','aleph':'\u2135','alpha':'\u03B1','Alpha':'\u0391','amacr':'\u0101','Amacr':'\u0100','amalg':'\u2A3F','amp':'&','AMP':'&','and':'\u2227','And':'\u2A53','andand':'\u2A55','andd':'\u2A5C','andslope':'\u2A58','andv':'\u2A5A','ang':'\u2220','ange':'\u29A4','angle':'\u2220','angmsd':'\u2221','angmsdaa':'\u29A8','angmsdab':'\u29A9','angmsdac':'\u29AA','angmsdad':'\u29AB','angmsdae':'\u29AC','angmsdaf':'\u29AD','angmsdag':'\u29AE','angmsdah':'\u29AF','angrt':'\u221F','angrtvb':'\u22BE','angrtvbd':'\u299D','angsph':'\u2222','angst':'\xC5','angzarr':'\u237C','aogon':'\u0105','Aogon':'\u0104','aopf':'\uD835\uDD52','Aopf':'\uD835\uDD38','ap':'\u2248','apacir':'\u2A6F','ape':'\u224A','apE':'\u2A70','apid':'\u224B','apos':'\'','ApplyFunction':'\u2061','approx':'\u2248','approxeq':'\u224A','aring':'\xE5','Aring':'\xC5','ascr':'\uD835\uDCB6','Ascr':'\uD835\uDC9C','Assign':'\u2254','ast':'*','asymp':'\u2248','asympeq':'\u224D','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','awconint':'\u2233','awint':'\u2A11','backcong':'\u224C','backepsilon':'\u03F6','backprime':'\u2035','backsim':'\u223D','backsimeq':'\u22CD','Backslash':'\u2216','Barv':'\u2AE7','barvee':'\u22BD','barwed':'\u2305','Barwed':'\u2306','barwedge':'\u2305','bbrk':'\u23B5','bbrktbrk':'\u23B6','bcong':'\u224C','bcy':'\u0431','Bcy':'\u0411','bdquo':'\u201E','becaus':'\u2235','because':'\u2235','Because':'\u2235','bemptyv':'\u29B0','bepsi':'\u03F6','bernou':'\u212C','Bernoullis':'\u212C','beta':'\u03B2','Beta':'\u0392','beth':'\u2136','between':'\u226C','bfr':'\uD835\uDD1F','Bfr':'\uD835\uDD05','bigcap':'\u22C2','bigcirc':'\u25EF','bigcup':'\u22C3','bigodot':'\u2A00','bigoplus':'\u2A01','bigotimes':'\u2A02','bigsqcup':'\u2A06','bigstar':'\u2605','bigtriangledown':'\u25BD','bigtriangleup':'\u25B3','biguplus':'\u2A04','bigvee':'\u22C1','bigwedge':'\u22C0','bkarow':'\u290D','blacklozenge':'\u29EB','blacksquare':'\u25AA','blacktriangle':'\u25B4','blacktriangledown':'\u25BE','blacktriangleleft':'\u25C2','blacktriangleright':'\u25B8','blank':'\u2423','blk12':'\u2592','blk14':'\u2591','blk34':'\u2593','block':'\u2588','bne':'=\u20E5','bnequiv':'\u2261\u20E5','bnot':'\u2310','bNot':'\u2AED','bopf':'\uD835\uDD53','Bopf':'\uD835\uDD39','bot':'\u22A5','bottom':'\u22A5','bowtie':'\u22C8','boxbox':'\u29C9','boxdl':'\u2510','boxdL':'\u2555','boxDl':'\u2556','boxDL':'\u2557','boxdr':'\u250C','boxdR':'\u2552','boxDr':'\u2553','boxDR':'\u2554','boxh':'\u2500','boxH':'\u2550','boxhd':'\u252C','boxhD':'\u2565','boxHd':'\u2564','boxHD':'\u2566','boxhu':'\u2534','boxhU':'\u2568','boxHu':'\u2567','boxHU':'\u2569','boxminus':'\u229F','boxplus':'\u229E','boxtimes':'\u22A0','boxul':'\u2518','boxuL':'\u255B','boxUl':'\u255C','boxUL':'\u255D','boxur':'\u2514','boxuR':'\u2558','boxUr':'\u2559','boxUR':'\u255A','boxv':'\u2502','boxV':'\u2551','boxvh':'\u253C','boxvH':'\u256A','boxVh':'\u256B','boxVH':'\u256C','boxvl':'\u2524','boxvL':'\u2561','boxVl':'\u2562','boxVL':'\u2563','boxvr':'\u251C','boxvR':'\u255E','boxVr':'\u255F','boxVR':'\u2560','bprime':'\u2035','breve':'\u02D8','Breve':'\u02D8','brvbar':'\xA6','bscr':'\uD835\uDCB7','Bscr':'\u212C','bsemi':'\u204F','bsim':'\u223D','bsime':'\u22CD','bsol':'\\','bsolb':'\u29C5','bsolhsub':'\u27C8','bull':'\u2022','bullet':'\u2022','bump':'\u224E','bumpe':'\u224F','bumpE':'\u2AAE','bumpeq':'\u224F','Bumpeq':'\u224E','cacute':'\u0107','Cacute':'\u0106','cap':'\u2229','Cap':'\u22D2','capand':'\u2A44','capbrcup':'\u2A49','capcap':'\u2A4B','capcup':'\u2A47','capdot':'\u2A40','CapitalDifferentialD':'\u2145','caps':'\u2229\uFE00','caret':'\u2041','caron':'\u02C7','Cayleys':'\u212D','ccaps':'\u2A4D','ccaron':'\u010D','Ccaron':'\u010C','ccedil':'\xE7','Ccedil':'\xC7','ccirc':'\u0109','Ccirc':'\u0108','Cconint':'\u2230','ccups':'\u2A4C','ccupssm':'\u2A50','cdot':'\u010B','Cdot':'\u010A','cedil':'\xB8','Cedilla':'\xB8','cemptyv':'\u29B2','cent':'\xA2','centerdot':'\xB7','CenterDot':'\xB7','cfr':'\uD835\uDD20','Cfr':'\u212D','chcy':'\u0447','CHcy':'\u0427','check':'\u2713','checkmark':'\u2713','chi':'\u03C7','Chi':'\u03A7','cir':'\u25CB','circ':'\u02C6','circeq':'\u2257','circlearrowleft':'\u21BA','circlearrowright':'\u21BB','circledast':'\u229B','circledcirc':'\u229A','circleddash':'\u229D','CircleDot':'\u2299','circledR':'\xAE','circledS':'\u24C8','CircleMinus':'\u2296','CirclePlus':'\u2295','CircleTimes':'\u2297','cire':'\u2257','cirE':'\u29C3','cirfnint':'\u2A10','cirmid':'\u2AEF','cirscir':'\u29C2','ClockwiseContourIntegral':'\u2232','CloseCurlyDoubleQuote':'\u201D','CloseCurlyQuote':'\u2019','clubs':'\u2663','clubsuit':'\u2663','colon':':','Colon':'\u2237','colone':'\u2254','Colone':'\u2A74','coloneq':'\u2254','comma':',','commat':'@','comp':'\u2201','compfn':'\u2218','complement':'\u2201','complexes':'\u2102','cong':'\u2245','congdot':'\u2A6D','Congruent':'\u2261','conint':'\u222E','Conint':'\u222F','ContourIntegral':'\u222E','copf':'\uD835\uDD54','Copf':'\u2102','coprod':'\u2210','Coproduct':'\u2210','copy':'\xA9','COPY':'\xA9','copysr':'\u2117','CounterClockwiseContourIntegral':'\u2233','crarr':'\u21B5','cross':'\u2717','Cross':'\u2A2F','cscr':'\uD835\uDCB8','Cscr':'\uD835\uDC9E','csub':'\u2ACF','csube':'\u2AD1','csup':'\u2AD0','csupe':'\u2AD2','ctdot':'\u22EF','cudarrl':'\u2938','cudarrr':'\u2935','cuepr':'\u22DE','cuesc':'\u22DF','cularr':'\u21B6','cularrp':'\u293D','cup':'\u222A','Cup':'\u22D3','cupbrcap':'\u2A48','cupcap':'\u2A46','CupCap':'\u224D','cupcup':'\u2A4A','cupdot':'\u228D','cupor':'\u2A45','cups':'\u222A\uFE00','curarr':'\u21B7','curarrm':'\u293C','curlyeqprec':'\u22DE','curlyeqsucc':'\u22DF','curlyvee':'\u22CE','curlywedge':'\u22CF','curren':'\xA4','curvearrowleft':'\u21B6','curvearrowright':'\u21B7','cuvee':'\u22CE','cuwed':'\u22CF','cwconint':'\u2232','cwint':'\u2231','cylcty':'\u232D','dagger':'\u2020','Dagger':'\u2021','daleth':'\u2138','darr':'\u2193','dArr':'\u21D3','Darr':'\u21A1','dash':'\u2010','dashv':'\u22A3','Dashv':'\u2AE4','dbkarow':'\u290F','dblac':'\u02DD','dcaron':'\u010F','Dcaron':'\u010E','dcy':'\u0434','Dcy':'\u0414','dd':'\u2146','DD':'\u2145','ddagger':'\u2021','ddarr':'\u21CA','DDotrahd':'\u2911','ddotseq':'\u2A77','deg':'\xB0','Del':'\u2207','delta':'\u03B4','Delta':'\u0394','demptyv':'\u29B1','dfisht':'\u297F','dfr':'\uD835\uDD21','Dfr':'\uD835\uDD07','dHar':'\u2965','dharl':'\u21C3','dharr':'\u21C2','DiacriticalAcute':'\xB4','DiacriticalDot':'\u02D9','DiacriticalDoubleAcute':'\u02DD','DiacriticalGrave':'`','DiacriticalTilde':'\u02DC','diam':'\u22C4','diamond':'\u22C4','Diamond':'\u22C4','diamondsuit':'\u2666','diams':'\u2666','die':'\xA8','DifferentialD':'\u2146','digamma':'\u03DD','disin':'\u22F2','div':'\xF7','divide':'\xF7','divideontimes':'\u22C7','divonx':'\u22C7','djcy':'\u0452','DJcy':'\u0402','dlcorn':'\u231E','dlcrop':'\u230D','dollar':'$','dopf':'\uD835\uDD55','Dopf':'\uD835\uDD3B','dot':'\u02D9','Dot':'\xA8','DotDot':'\u20DC','doteq':'\u2250','doteqdot':'\u2251','DotEqual':'\u2250','dotminus':'\u2238','dotplus':'\u2214','dotsquare':'\u22A1','doublebarwedge':'\u2306','DoubleContourIntegral':'\u222F','DoubleDot':'\xA8','DoubleDownArrow':'\u21D3','DoubleLeftArrow':'\u21D0','DoubleLeftRightArrow':'\u21D4','DoubleLeftTee':'\u2AE4','DoubleLongLeftArrow':'\u27F8','DoubleLongLeftRightArrow':'\u27FA','DoubleLongRightArrow':'\u27F9','DoubleRightArrow':'\u21D2','DoubleRightTee':'\u22A8','DoubleUpArrow':'\u21D1','DoubleUpDownArrow':'\u21D5','DoubleVerticalBar':'\u2225','downarrow':'\u2193','Downarrow':'\u21D3','DownArrow':'\u2193','DownArrowBar':'\u2913','DownArrowUpArrow':'\u21F5','DownBreve':'\u0311','downdownarrows':'\u21CA','downharpoonleft':'\u21C3','downharpoonright':'\u21C2','DownLeftRightVector':'\u2950','DownLeftTeeVector':'\u295E','DownLeftVector':'\u21BD','DownLeftVectorBar':'\u2956','DownRightTeeVector':'\u295F','DownRightVector':'\u21C1','DownRightVectorBar':'\u2957','DownTee':'\u22A4','DownTeeArrow':'\u21A7','drbkarow':'\u2910','drcorn':'\u231F','drcrop':'\u230C','dscr':'\uD835\uDCB9','Dscr':'\uD835\uDC9F','dscy':'\u0455','DScy':'\u0405','dsol':'\u29F6','dstrok':'\u0111','Dstrok':'\u0110','dtdot':'\u22F1','dtri':'\u25BF','dtrif':'\u25BE','duarr':'\u21F5','duhar':'\u296F','dwangle':'\u29A6','dzcy':'\u045F','DZcy':'\u040F','dzigrarr':'\u27FF','eacute':'\xE9','Eacute':'\xC9','easter':'\u2A6E','ecaron':'\u011B','Ecaron':'\u011A','ecir':'\u2256','ecirc':'\xEA','Ecirc':'\xCA','ecolon':'\u2255','ecy':'\u044D','Ecy':'\u042D','eDDot':'\u2A77','edot':'\u0117','eDot':'\u2251','Edot':'\u0116','ee':'\u2147','efDot':'\u2252','efr':'\uD835\uDD22','Efr':'\uD835\uDD08','eg':'\u2A9A','egrave':'\xE8','Egrave':'\xC8','egs':'\u2A96','egsdot':'\u2A98','el':'\u2A99','Element':'\u2208','elinters':'\u23E7','ell':'\u2113','els':'\u2A95','elsdot':'\u2A97','emacr':'\u0113','Emacr':'\u0112','empty':'\u2205','emptyset':'\u2205','EmptySmallSquare':'\u25FB','emptyv':'\u2205','EmptyVerySmallSquare':'\u25AB','emsp':'\u2003','emsp13':'\u2004','emsp14':'\u2005','eng':'\u014B','ENG':'\u014A','ensp':'\u2002','eogon':'\u0119','Eogon':'\u0118','eopf':'\uD835\uDD56','Eopf':'\uD835\uDD3C','epar':'\u22D5','eparsl':'\u29E3','eplus':'\u2A71','epsi':'\u03B5','epsilon':'\u03B5','Epsilon':'\u0395','epsiv':'\u03F5','eqcirc':'\u2256','eqcolon':'\u2255','eqsim':'\u2242','eqslantgtr':'\u2A96','eqslantless':'\u2A95','Equal':'\u2A75','equals':'=','EqualTilde':'\u2242','equest':'\u225F','Equilibrium':'\u21CC','equiv':'\u2261','equivDD':'\u2A78','eqvparsl':'\u29E5','erarr':'\u2971','erDot':'\u2253','escr':'\u212F','Escr':'\u2130','esdot':'\u2250','esim':'\u2242','Esim':'\u2A73','eta':'\u03B7','Eta':'\u0397','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','euro':'\u20AC','excl':'!','exist':'\u2203','Exists':'\u2203','expectation':'\u2130','exponentiale':'\u2147','ExponentialE':'\u2147','fallingdotseq':'\u2252','fcy':'\u0444','Fcy':'\u0424','female':'\u2640','ffilig':'\uFB03','fflig':'\uFB00','ffllig':'\uFB04','ffr':'\uD835\uDD23','Ffr':'\uD835\uDD09','filig':'\uFB01','FilledSmallSquare':'\u25FC','FilledVerySmallSquare':'\u25AA','fjlig':'fj','flat':'\u266D','fllig':'\uFB02','fltns':'\u25B1','fnof':'\u0192','fopf':'\uD835\uDD57','Fopf':'\uD835\uDD3D','forall':'\u2200','ForAll':'\u2200','fork':'\u22D4','forkv':'\u2AD9','Fouriertrf':'\u2131','fpartint':'\u2A0D','frac12':'\xBD','frac13':'\u2153','frac14':'\xBC','frac15':'\u2155','frac16':'\u2159','frac18':'\u215B','frac23':'\u2154','frac25':'\u2156','frac34':'\xBE','frac35':'\u2157','frac38':'\u215C','frac45':'\u2158','frac56':'\u215A','frac58':'\u215D','frac78':'\u215E','frasl':'\u2044','frown':'\u2322','fscr':'\uD835\uDCBB','Fscr':'\u2131','gacute':'\u01F5','gamma':'\u03B3','Gamma':'\u0393','gammad':'\u03DD','Gammad':'\u03DC','gap':'\u2A86','gbreve':'\u011F','Gbreve':'\u011E','Gcedil':'\u0122','gcirc':'\u011D','Gcirc':'\u011C','gcy':'\u0433','Gcy':'\u0413','gdot':'\u0121','Gdot':'\u0120','ge':'\u2265','gE':'\u2267','gel':'\u22DB','gEl':'\u2A8C','geq':'\u2265','geqq':'\u2267','geqslant':'\u2A7E','ges':'\u2A7E','gescc':'\u2AA9','gesdot':'\u2A80','gesdoto':'\u2A82','gesdotol':'\u2A84','gesl':'\u22DB\uFE00','gesles':'\u2A94','gfr':'\uD835\uDD24','Gfr':'\uD835\uDD0A','gg':'\u226B','Gg':'\u22D9','ggg':'\u22D9','gimel':'\u2137','gjcy':'\u0453','GJcy':'\u0403','gl':'\u2277','gla':'\u2AA5','glE':'\u2A92','glj':'\u2AA4','gnap':'\u2A8A','gnapprox':'\u2A8A','gne':'\u2A88','gnE':'\u2269','gneq':'\u2A88','gneqq':'\u2269','gnsim':'\u22E7','gopf':'\uD835\uDD58','Gopf':'\uD835\uDD3E','grave':'`','GreaterEqual':'\u2265','GreaterEqualLess':'\u22DB','GreaterFullEqual':'\u2267','GreaterGreater':'\u2AA2','GreaterLess':'\u2277','GreaterSlantEqual':'\u2A7E','GreaterTilde':'\u2273','gscr':'\u210A','Gscr':'\uD835\uDCA2','gsim':'\u2273','gsime':'\u2A8E','gsiml':'\u2A90','gt':'>','Gt':'\u226B','GT':'>','gtcc':'\u2AA7','gtcir':'\u2A7A','gtdot':'\u22D7','gtlPar':'\u2995','gtquest':'\u2A7C','gtrapprox':'\u2A86','gtrarr':'\u2978','gtrdot':'\u22D7','gtreqless':'\u22DB','gtreqqless':'\u2A8C','gtrless':'\u2277','gtrsim':'\u2273','gvertneqq':'\u2269\uFE00','gvnE':'\u2269\uFE00','Hacek':'\u02C7','hairsp':'\u200A','half':'\xBD','hamilt':'\u210B','hardcy':'\u044A','HARDcy':'\u042A','harr':'\u2194','hArr':'\u21D4','harrcir':'\u2948','harrw':'\u21AD','Hat':'^','hbar':'\u210F','hcirc':'\u0125','Hcirc':'\u0124','hearts':'\u2665','heartsuit':'\u2665','hellip':'\u2026','hercon':'\u22B9','hfr':'\uD835\uDD25','Hfr':'\u210C','HilbertSpace':'\u210B','hksearow':'\u2925','hkswarow':'\u2926','hoarr':'\u21FF','homtht':'\u223B','hookleftarrow':'\u21A9','hookrightarrow':'\u21AA','hopf':'\uD835\uDD59','Hopf':'\u210D','horbar':'\u2015','HorizontalLine':'\u2500','hscr':'\uD835\uDCBD','Hscr':'\u210B','hslash':'\u210F','hstrok':'\u0127','Hstrok':'\u0126','HumpDownHump':'\u224E','HumpEqual':'\u224F','hybull':'\u2043','hyphen':'\u2010','iacute':'\xED','Iacute':'\xCD','ic':'\u2063','icirc':'\xEE','Icirc':'\xCE','icy':'\u0438','Icy':'\u0418','Idot':'\u0130','iecy':'\u0435','IEcy':'\u0415','iexcl':'\xA1','iff':'\u21D4','ifr':'\uD835\uDD26','Ifr':'\u2111','igrave':'\xEC','Igrave':'\xCC','ii':'\u2148','iiiint':'\u2A0C','iiint':'\u222D','iinfin':'\u29DC','iiota':'\u2129','ijlig':'\u0133','IJlig':'\u0132','Im':'\u2111','imacr':'\u012B','Imacr':'\u012A','image':'\u2111','ImaginaryI':'\u2148','imagline':'\u2110','imagpart':'\u2111','imath':'\u0131','imof':'\u22B7','imped':'\u01B5','Implies':'\u21D2','in':'\u2208','incare':'\u2105','infin':'\u221E','infintie':'\u29DD','inodot':'\u0131','int':'\u222B','Int':'\u222C','intcal':'\u22BA','integers':'\u2124','Integral':'\u222B','intercal':'\u22BA','Intersection':'\u22C2','intlarhk':'\u2A17','intprod':'\u2A3C','InvisibleComma':'\u2063','InvisibleTimes':'\u2062','iocy':'\u0451','IOcy':'\u0401','iogon':'\u012F','Iogon':'\u012E','iopf':'\uD835\uDD5A','Iopf':'\uD835\uDD40','iota':'\u03B9','Iota':'\u0399','iprod':'\u2A3C','iquest':'\xBF','iscr':'\uD835\uDCBE','Iscr':'\u2110','isin':'\u2208','isindot':'\u22F5','isinE':'\u22F9','isins':'\u22F4','isinsv':'\u22F3','isinv':'\u2208','it':'\u2062','itilde':'\u0129','Itilde':'\u0128','iukcy':'\u0456','Iukcy':'\u0406','iuml':'\xEF','Iuml':'\xCF','jcirc':'\u0135','Jcirc':'\u0134','jcy':'\u0439','Jcy':'\u0419','jfr':'\uD835\uDD27','Jfr':'\uD835\uDD0D','jmath':'\u0237','jopf':'\uD835\uDD5B','Jopf':'\uD835\uDD41','jscr':'\uD835\uDCBF','Jscr':'\uD835\uDCA5','jsercy':'\u0458','Jsercy':'\u0408','jukcy':'\u0454','Jukcy':'\u0404','kappa':'\u03BA','Kappa':'\u039A','kappav':'\u03F0','kcedil':'\u0137','Kcedil':'\u0136','kcy':'\u043A','Kcy':'\u041A','kfr':'\uD835\uDD28','Kfr':'\uD835\uDD0E','kgreen':'\u0138','khcy':'\u0445','KHcy':'\u0425','kjcy':'\u045C','KJcy':'\u040C','kopf':'\uD835\uDD5C','Kopf':'\uD835\uDD42','kscr':'\uD835\uDCC0','Kscr':'\uD835\uDCA6','lAarr':'\u21DA','lacute':'\u013A','Lacute':'\u0139','laemptyv':'\u29B4','lagran':'\u2112','lambda':'\u03BB','Lambda':'\u039B','lang':'\u27E8','Lang':'\u27EA','langd':'\u2991','langle':'\u27E8','lap':'\u2A85','Laplacetrf':'\u2112','laquo':'\xAB','larr':'\u2190','lArr':'\u21D0','Larr':'\u219E','larrb':'\u21E4','larrbfs':'\u291F','larrfs':'\u291D','larrhk':'\u21A9','larrlp':'\u21AB','larrpl':'\u2939','larrsim':'\u2973','larrtl':'\u21A2','lat':'\u2AAB','latail':'\u2919','lAtail':'\u291B','late':'\u2AAD','lates':'\u2AAD\uFE00','lbarr':'\u290C','lBarr':'\u290E','lbbrk':'\u2772','lbrace':'{','lbrack':'[','lbrke':'\u298B','lbrksld':'\u298F','lbrkslu':'\u298D','lcaron':'\u013E','Lcaron':'\u013D','lcedil':'\u013C','Lcedil':'\u013B','lceil':'\u2308','lcub':'{','lcy':'\u043B','Lcy':'\u041B','ldca':'\u2936','ldquo':'\u201C','ldquor':'\u201E','ldrdhar':'\u2967','ldrushar':'\u294B','ldsh':'\u21B2','le':'\u2264','lE':'\u2266','LeftAngleBracket':'\u27E8','leftarrow':'\u2190','Leftarrow':'\u21D0','LeftArrow':'\u2190','LeftArrowBar':'\u21E4','LeftArrowRightArrow':'\u21C6','leftarrowtail':'\u21A2','LeftCeiling':'\u2308','LeftDoubleBracket':'\u27E6','LeftDownTeeVector':'\u2961','LeftDownVector':'\u21C3','LeftDownVectorBar':'\u2959','LeftFloor':'\u230A','leftharpoondown':'\u21BD','leftharpoonup':'\u21BC','leftleftarrows':'\u21C7','leftrightarrow':'\u2194','Leftrightarrow':'\u21D4','LeftRightArrow':'\u2194','leftrightarrows':'\u21C6','leftrightharpoons':'\u21CB','leftrightsquigarrow':'\u21AD','LeftRightVector':'\u294E','LeftTee':'\u22A3','LeftTeeArrow':'\u21A4','LeftTeeVector':'\u295A','leftthreetimes':'\u22CB','LeftTriangle':'\u22B2','LeftTriangleBar':'\u29CF','LeftTriangleEqual':'\u22B4','LeftUpDownVector':'\u2951','LeftUpTeeVector':'\u2960','LeftUpVector':'\u21BF','LeftUpVectorBar':'\u2958','LeftVector':'\u21BC','LeftVectorBar':'\u2952','leg':'\u22DA','lEg':'\u2A8B','leq':'\u2264','leqq':'\u2266','leqslant':'\u2A7D','les':'\u2A7D','lescc':'\u2AA8','lesdot':'\u2A7F','lesdoto':'\u2A81','lesdotor':'\u2A83','lesg':'\u22DA\uFE00','lesges':'\u2A93','lessapprox':'\u2A85','lessdot':'\u22D6','lesseqgtr':'\u22DA','lesseqqgtr':'\u2A8B','LessEqualGreater':'\u22DA','LessFullEqual':'\u2266','LessGreater':'\u2276','lessgtr':'\u2276','LessLess':'\u2AA1','lesssim':'\u2272','LessSlantEqual':'\u2A7D','LessTilde':'\u2272','lfisht':'\u297C','lfloor':'\u230A','lfr':'\uD835\uDD29','Lfr':'\uD835\uDD0F','lg':'\u2276','lgE':'\u2A91','lHar':'\u2962','lhard':'\u21BD','lharu':'\u21BC','lharul':'\u296A','lhblk':'\u2584','ljcy':'\u0459','LJcy':'\u0409','ll':'\u226A','Ll':'\u22D8','llarr':'\u21C7','llcorner':'\u231E','Lleftarrow':'\u21DA','llhard':'\u296B','lltri':'\u25FA','lmidot':'\u0140','Lmidot':'\u013F','lmoust':'\u23B0','lmoustache':'\u23B0','lnap':'\u2A89','lnapprox':'\u2A89','lne':'\u2A87','lnE':'\u2268','lneq':'\u2A87','lneqq':'\u2268','lnsim':'\u22E6','loang':'\u27EC','loarr':'\u21FD','lobrk':'\u27E6','longleftarrow':'\u27F5','Longleftarrow':'\u27F8','LongLeftArrow':'\u27F5','longleftrightarrow':'\u27F7','Longleftrightarrow':'\u27FA','LongLeftRightArrow':'\u27F7','longmapsto':'\u27FC','longrightarrow':'\u27F6','Longrightarrow':'\u27F9','LongRightArrow':'\u27F6','looparrowleft':'\u21AB','looparrowright':'\u21AC','lopar':'\u2985','lopf':'\uD835\uDD5D','Lopf':'\uD835\uDD43','loplus':'\u2A2D','lotimes':'\u2A34','lowast':'\u2217','lowbar':'_','LowerLeftArrow':'\u2199','LowerRightArrow':'\u2198','loz':'\u25CA','lozenge':'\u25CA','lozf':'\u29EB','lpar':'(','lparlt':'\u2993','lrarr':'\u21C6','lrcorner':'\u231F','lrhar':'\u21CB','lrhard':'\u296D','lrm':'\u200E','lrtri':'\u22BF','lsaquo':'\u2039','lscr':'\uD835\uDCC1','Lscr':'\u2112','lsh':'\u21B0','Lsh':'\u21B0','lsim':'\u2272','lsime':'\u2A8D','lsimg':'\u2A8F','lsqb':'[','lsquo':'\u2018','lsquor':'\u201A','lstrok':'\u0142','Lstrok':'\u0141','lt':'<','Lt':'\u226A','LT':'<','ltcc':'\u2AA6','ltcir':'\u2A79','ltdot':'\u22D6','lthree':'\u22CB','ltimes':'\u22C9','ltlarr':'\u2976','ltquest':'\u2A7B','ltri':'\u25C3','ltrie':'\u22B4','ltrif':'\u25C2','ltrPar':'\u2996','lurdshar':'\u294A','luruhar':'\u2966','lvertneqq':'\u2268\uFE00','lvnE':'\u2268\uFE00','macr':'\xAF','male':'\u2642','malt':'\u2720','maltese':'\u2720','map':'\u21A6','Map':'\u2905','mapsto':'\u21A6','mapstodown':'\u21A7','mapstoleft':'\u21A4','mapstoup':'\u21A5','marker':'\u25AE','mcomma':'\u2A29','mcy':'\u043C','Mcy':'\u041C','mdash':'\u2014','mDDot':'\u223A','measuredangle':'\u2221','MediumSpace':'\u205F','Mellintrf':'\u2133','mfr':'\uD835\uDD2A','Mfr':'\uD835\uDD10','mho':'\u2127','micro':'\xB5','mid':'\u2223','midast':'*','midcir':'\u2AF0','middot':'\xB7','minus':'\u2212','minusb':'\u229F','minusd':'\u2238','minusdu':'\u2A2A','MinusPlus':'\u2213','mlcp':'\u2ADB','mldr':'\u2026','mnplus':'\u2213','models':'\u22A7','mopf':'\uD835\uDD5E','Mopf':'\uD835\uDD44','mp':'\u2213','mscr':'\uD835\uDCC2','Mscr':'\u2133','mstpos':'\u223E','mu':'\u03BC','Mu':'\u039C','multimap':'\u22B8','mumap':'\u22B8','nabla':'\u2207','nacute':'\u0144','Nacute':'\u0143','nang':'\u2220\u20D2','nap':'\u2249','napE':'\u2A70\u0338','napid':'\u224B\u0338','napos':'\u0149','napprox':'\u2249','natur':'\u266E','natural':'\u266E','naturals':'\u2115','nbsp':'\xA0','nbump':'\u224E\u0338','nbumpe':'\u224F\u0338','ncap':'\u2A43','ncaron':'\u0148','Ncaron':'\u0147','ncedil':'\u0146','Ncedil':'\u0145','ncong':'\u2247','ncongdot':'\u2A6D\u0338','ncup':'\u2A42','ncy':'\u043D','Ncy':'\u041D','ndash':'\u2013','ne':'\u2260','nearhk':'\u2924','nearr':'\u2197','neArr':'\u21D7','nearrow':'\u2197','nedot':'\u2250\u0338','NegativeMediumSpace':'\u200B','NegativeThickSpace':'\u200B','NegativeThinSpace':'\u200B','NegativeVeryThinSpace':'\u200B','nequiv':'\u2262','nesear':'\u2928','nesim':'\u2242\u0338','NestedGreaterGreater':'\u226B','NestedLessLess':'\u226A','NewLine':'\n','nexist':'\u2204','nexists':'\u2204','nfr':'\uD835\uDD2B','Nfr':'\uD835\uDD11','nge':'\u2271','ngE':'\u2267\u0338','ngeq':'\u2271','ngeqq':'\u2267\u0338','ngeqslant':'\u2A7E\u0338','nges':'\u2A7E\u0338','nGg':'\u22D9\u0338','ngsim':'\u2275','ngt':'\u226F','nGt':'\u226B\u20D2','ngtr':'\u226F','nGtv':'\u226B\u0338','nharr':'\u21AE','nhArr':'\u21CE','nhpar':'\u2AF2','ni':'\u220B','nis':'\u22FC','nisd':'\u22FA','niv':'\u220B','njcy':'\u045A','NJcy':'\u040A','nlarr':'\u219A','nlArr':'\u21CD','nldr':'\u2025','nle':'\u2270','nlE':'\u2266\u0338','nleftarrow':'\u219A','nLeftarrow':'\u21CD','nleftrightarrow':'\u21AE','nLeftrightarrow':'\u21CE','nleq':'\u2270','nleqq':'\u2266\u0338','nleqslant':'\u2A7D\u0338','nles':'\u2A7D\u0338','nless':'\u226E','nLl':'\u22D8\u0338','nlsim':'\u2274','nlt':'\u226E','nLt':'\u226A\u20D2','nltri':'\u22EA','nltrie':'\u22EC','nLtv':'\u226A\u0338','nmid':'\u2224','NoBreak':'\u2060','NonBreakingSpace':'\xA0','nopf':'\uD835\uDD5F','Nopf':'\u2115','not':'\xAC','Not':'\u2AEC','NotCongruent':'\u2262','NotCupCap':'\u226D','NotDoubleVerticalBar':'\u2226','NotElement':'\u2209','NotEqual':'\u2260','NotEqualTilde':'\u2242\u0338','NotExists':'\u2204','NotGreater':'\u226F','NotGreaterEqual':'\u2271','NotGreaterFullEqual':'\u2267\u0338','NotGreaterGreater':'\u226B\u0338','NotGreaterLess':'\u2279','NotGreaterSlantEqual':'\u2A7E\u0338','NotGreaterTilde':'\u2275','NotHumpDownHump':'\u224E\u0338','NotHumpEqual':'\u224F\u0338','notin':'\u2209','notindot':'\u22F5\u0338','notinE':'\u22F9\u0338','notinva':'\u2209','notinvb':'\u22F7','notinvc':'\u22F6','NotLeftTriangle':'\u22EA','NotLeftTriangleBar':'\u29CF\u0338','NotLeftTriangleEqual':'\u22EC','NotLess':'\u226E','NotLessEqual':'\u2270','NotLessGreater':'\u2278','NotLessLess':'\u226A\u0338','NotLessSlantEqual':'\u2A7D\u0338','NotLessTilde':'\u2274','NotNestedGreaterGreater':'\u2AA2\u0338','NotNestedLessLess':'\u2AA1\u0338','notni':'\u220C','notniva':'\u220C','notnivb':'\u22FE','notnivc':'\u22FD','NotPrecedes':'\u2280','NotPrecedesEqual':'\u2AAF\u0338','NotPrecedesSlantEqual':'\u22E0','NotReverseElement':'\u220C','NotRightTriangle':'\u22EB','NotRightTriangleBar':'\u29D0\u0338','NotRightTriangleEqual':'\u22ED','NotSquareSubset':'\u228F\u0338','NotSquareSubsetEqual':'\u22E2','NotSquareSuperset':'\u2290\u0338','NotSquareSupersetEqual':'\u22E3','NotSubset':'\u2282\u20D2','NotSubsetEqual':'\u2288','NotSucceeds':'\u2281','NotSucceedsEqual':'\u2AB0\u0338','NotSucceedsSlantEqual':'\u22E1','NotSucceedsTilde':'\u227F\u0338','NotSuperset':'\u2283\u20D2','NotSupersetEqual':'\u2289','NotTilde':'\u2241','NotTildeEqual':'\u2244','NotTildeFullEqual':'\u2247','NotTildeTilde':'\u2249','NotVerticalBar':'\u2224','npar':'\u2226','nparallel':'\u2226','nparsl':'\u2AFD\u20E5','npart':'\u2202\u0338','npolint':'\u2A14','npr':'\u2280','nprcue':'\u22E0','npre':'\u2AAF\u0338','nprec':'\u2280','npreceq':'\u2AAF\u0338','nrarr':'\u219B','nrArr':'\u21CF','nrarrc':'\u2933\u0338','nrarrw':'\u219D\u0338','nrightarrow':'\u219B','nRightarrow':'\u21CF','nrtri':'\u22EB','nrtrie':'\u22ED','nsc':'\u2281','nsccue':'\u22E1','nsce':'\u2AB0\u0338','nscr':'\uD835\uDCC3','Nscr':'\uD835\uDCA9','nshortmid':'\u2224','nshortparallel':'\u2226','nsim':'\u2241','nsime':'\u2244','nsimeq':'\u2244','nsmid':'\u2224','nspar':'\u2226','nsqsube':'\u22E2','nsqsupe':'\u22E3','nsub':'\u2284','nsube':'\u2288','nsubE':'\u2AC5\u0338','nsubset':'\u2282\u20D2','nsubseteq':'\u2288','nsubseteqq':'\u2AC5\u0338','nsucc':'\u2281','nsucceq':'\u2AB0\u0338','nsup':'\u2285','nsupe':'\u2289','nsupE':'\u2AC6\u0338','nsupset':'\u2283\u20D2','nsupseteq':'\u2289','nsupseteqq':'\u2AC6\u0338','ntgl':'\u2279','ntilde':'\xF1','Ntilde':'\xD1','ntlg':'\u2278','ntriangleleft':'\u22EA','ntrianglelefteq':'\u22EC','ntriangleright':'\u22EB','ntrianglerighteq':'\u22ED','nu':'\u03BD','Nu':'\u039D','num':'#','numero':'\u2116','numsp':'\u2007','nvap':'\u224D\u20D2','nvdash':'\u22AC','nvDash':'\u22AD','nVdash':'\u22AE','nVDash':'\u22AF','nvge':'\u2265\u20D2','nvgt':'>\u20D2','nvHarr':'\u2904','nvinfin':'\u29DE','nvlArr':'\u2902','nvle':'\u2264\u20D2','nvlt':'<\u20D2','nvltrie':'\u22B4\u20D2','nvrArr':'\u2903','nvrtrie':'\u22B5\u20D2','nvsim':'\u223C\u20D2','nwarhk':'\u2923','nwarr':'\u2196','nwArr':'\u21D6','nwarrow':'\u2196','nwnear':'\u2927','oacute':'\xF3','Oacute':'\xD3','oast':'\u229B','ocir':'\u229A','ocirc':'\xF4','Ocirc':'\xD4','ocy':'\u043E','Ocy':'\u041E','odash':'\u229D','odblac':'\u0151','Odblac':'\u0150','odiv':'\u2A38','odot':'\u2299','odsold':'\u29BC','oelig':'\u0153','OElig':'\u0152','ofcir':'\u29BF','ofr':'\uD835\uDD2C','Ofr':'\uD835\uDD12','ogon':'\u02DB','ograve':'\xF2','Ograve':'\xD2','ogt':'\u29C1','ohbar':'\u29B5','ohm':'\u03A9','oint':'\u222E','olarr':'\u21BA','olcir':'\u29BE','olcross':'\u29BB','oline':'\u203E','olt':'\u29C0','omacr':'\u014D','Omacr':'\u014C','omega':'\u03C9','Omega':'\u03A9','omicron':'\u03BF','Omicron':'\u039F','omid':'\u29B6','ominus':'\u2296','oopf':'\uD835\uDD60','Oopf':'\uD835\uDD46','opar':'\u29B7','OpenCurlyDoubleQuote':'\u201C','OpenCurlyQuote':'\u2018','operp':'\u29B9','oplus':'\u2295','or':'\u2228','Or':'\u2A54','orarr':'\u21BB','ord':'\u2A5D','order':'\u2134','orderof':'\u2134','ordf':'\xAA','ordm':'\xBA','origof':'\u22B6','oror':'\u2A56','orslope':'\u2A57','orv':'\u2A5B','oS':'\u24C8','oscr':'\u2134','Oscr':'\uD835\uDCAA','oslash':'\xF8','Oslash':'\xD8','osol':'\u2298','otilde':'\xF5','Otilde':'\xD5','otimes':'\u2297','Otimes':'\u2A37','otimesas':'\u2A36','ouml':'\xF6','Ouml':'\xD6','ovbar':'\u233D','OverBar':'\u203E','OverBrace':'\u23DE','OverBracket':'\u23B4','OverParenthesis':'\u23DC','par':'\u2225','para':'\xB6','parallel':'\u2225','parsim':'\u2AF3','parsl':'\u2AFD','part':'\u2202','PartialD':'\u2202','pcy':'\u043F','Pcy':'\u041F','percnt':'%','period':'.','permil':'\u2030','perp':'\u22A5','pertenk':'\u2031','pfr':'\uD835\uDD2D','Pfr':'\uD835\uDD13','phi':'\u03C6','Phi':'\u03A6','phiv':'\u03D5','phmmat':'\u2133','phone':'\u260E','pi':'\u03C0','Pi':'\u03A0','pitchfork':'\u22D4','piv':'\u03D6','planck':'\u210F','planckh':'\u210E','plankv':'\u210F','plus':'+','plusacir':'\u2A23','plusb':'\u229E','pluscir':'\u2A22','plusdo':'\u2214','plusdu':'\u2A25','pluse':'\u2A72','PlusMinus':'\xB1','plusmn':'\xB1','plussim':'\u2A26','plustwo':'\u2A27','pm':'\xB1','Poincareplane':'\u210C','pointint':'\u2A15','popf':'\uD835\uDD61','Popf':'\u2119','pound':'\xA3','pr':'\u227A','Pr':'\u2ABB','prap':'\u2AB7','prcue':'\u227C','pre':'\u2AAF','prE':'\u2AB3','prec':'\u227A','precapprox':'\u2AB7','preccurlyeq':'\u227C','Precedes':'\u227A','PrecedesEqual':'\u2AAF','PrecedesSlantEqual':'\u227C','PrecedesTilde':'\u227E','preceq':'\u2AAF','precnapprox':'\u2AB9','precneqq':'\u2AB5','precnsim':'\u22E8','precsim':'\u227E','prime':'\u2032','Prime':'\u2033','primes':'\u2119','prnap':'\u2AB9','prnE':'\u2AB5','prnsim':'\u22E8','prod':'\u220F','Product':'\u220F','profalar':'\u232E','profline':'\u2312','profsurf':'\u2313','prop':'\u221D','Proportion':'\u2237','Proportional':'\u221D','propto':'\u221D','prsim':'\u227E','prurel':'\u22B0','pscr':'\uD835\uDCC5','Pscr':'\uD835\uDCAB','psi':'\u03C8','Psi':'\u03A8','puncsp':'\u2008','qfr':'\uD835\uDD2E','Qfr':'\uD835\uDD14','qint':'\u2A0C','qopf':'\uD835\uDD62','Qopf':'\u211A','qprime':'\u2057','qscr':'\uD835\uDCC6','Qscr':'\uD835\uDCAC','quaternions':'\u210D','quatint':'\u2A16','quest':'?','questeq':'\u225F','quot':'"','QUOT':'"','rAarr':'\u21DB','race':'\u223D\u0331','racute':'\u0155','Racute':'\u0154','radic':'\u221A','raemptyv':'\u29B3','rang':'\u27E9','Rang':'\u27EB','rangd':'\u2992','range':'\u29A5','rangle':'\u27E9','raquo':'\xBB','rarr':'\u2192','rArr':'\u21D2','Rarr':'\u21A0','rarrap':'\u2975','rarrb':'\u21E5','rarrbfs':'\u2920','rarrc':'\u2933','rarrfs':'\u291E','rarrhk':'\u21AA','rarrlp':'\u21AC','rarrpl':'\u2945','rarrsim':'\u2974','rarrtl':'\u21A3','Rarrtl':'\u2916','rarrw':'\u219D','ratail':'\u291A','rAtail':'\u291C','ratio':'\u2236','rationals':'\u211A','rbarr':'\u290D','rBarr':'\u290F','RBarr':'\u2910','rbbrk':'\u2773','rbrace':'}','rbrack':']','rbrke':'\u298C','rbrksld':'\u298E','rbrkslu':'\u2990','rcaron':'\u0159','Rcaron':'\u0158','rcedil':'\u0157','Rcedil':'\u0156','rceil':'\u2309','rcub':'}','rcy':'\u0440','Rcy':'\u0420','rdca':'\u2937','rdldhar':'\u2969','rdquo':'\u201D','rdquor':'\u201D','rdsh':'\u21B3','Re':'\u211C','real':'\u211C','realine':'\u211B','realpart':'\u211C','reals':'\u211D','rect':'\u25AD','reg':'\xAE','REG':'\xAE','ReverseElement':'\u220B','ReverseEquilibrium':'\u21CB','ReverseUpEquilibrium':'\u296F','rfisht':'\u297D','rfloor':'\u230B','rfr':'\uD835\uDD2F','Rfr':'\u211C','rHar':'\u2964','rhard':'\u21C1','rharu':'\u21C0','rharul':'\u296C','rho':'\u03C1','Rho':'\u03A1','rhov':'\u03F1','RightAngleBracket':'\u27E9','rightarrow':'\u2192','Rightarrow':'\u21D2','RightArrow':'\u2192','RightArrowBar':'\u21E5','RightArrowLeftArrow':'\u21C4','rightarrowtail':'\u21A3','RightCeiling':'\u2309','RightDoubleBracket':'\u27E7','RightDownTeeVector':'\u295D','RightDownVector':'\u21C2','RightDownVectorBar':'\u2955','RightFloor':'\u230B','rightharpoondown':'\u21C1','rightharpoonup':'\u21C0','rightleftarrows':'\u21C4','rightleftharpoons':'\u21CC','rightrightarrows':'\u21C9','rightsquigarrow':'\u219D','RightTee':'\u22A2','RightTeeArrow':'\u21A6','RightTeeVector':'\u295B','rightthreetimes':'\u22CC','RightTriangle':'\u22B3','RightTriangleBar':'\u29D0','RightTriangleEqual':'\u22B5','RightUpDownVector':'\u294F','RightUpTeeVector':'\u295C','RightUpVector':'\u21BE','RightUpVectorBar':'\u2954','RightVector':'\u21C0','RightVectorBar':'\u2953','ring':'\u02DA','risingdotseq':'\u2253','rlarr':'\u21C4','rlhar':'\u21CC','rlm':'\u200F','rmoust':'\u23B1','rmoustache':'\u23B1','rnmid':'\u2AEE','roang':'\u27ED','roarr':'\u21FE','robrk':'\u27E7','ropar':'\u2986','ropf':'\uD835\uDD63','Ropf':'\u211D','roplus':'\u2A2E','rotimes':'\u2A35','RoundImplies':'\u2970','rpar':')','rpargt':'\u2994','rppolint':'\u2A12','rrarr':'\u21C9','Rrightarrow':'\u21DB','rsaquo':'\u203A','rscr':'\uD835\uDCC7','Rscr':'\u211B','rsh':'\u21B1','Rsh':'\u21B1','rsqb':']','rsquo':'\u2019','rsquor':'\u2019','rthree':'\u22CC','rtimes':'\u22CA','rtri':'\u25B9','rtrie':'\u22B5','rtrif':'\u25B8','rtriltri':'\u29CE','RuleDelayed':'\u29F4','ruluhar':'\u2968','rx':'\u211E','sacute':'\u015B','Sacute':'\u015A','sbquo':'\u201A','sc':'\u227B','Sc':'\u2ABC','scap':'\u2AB8','scaron':'\u0161','Scaron':'\u0160','sccue':'\u227D','sce':'\u2AB0','scE':'\u2AB4','scedil':'\u015F','Scedil':'\u015E','scirc':'\u015D','Scirc':'\u015C','scnap':'\u2ABA','scnE':'\u2AB6','scnsim':'\u22E9','scpolint':'\u2A13','scsim':'\u227F','scy':'\u0441','Scy':'\u0421','sdot':'\u22C5','sdotb':'\u22A1','sdote':'\u2A66','searhk':'\u2925','searr':'\u2198','seArr':'\u21D8','searrow':'\u2198','sect':'\xA7','semi':';','seswar':'\u2929','setminus':'\u2216','setmn':'\u2216','sext':'\u2736','sfr':'\uD835\uDD30','Sfr':'\uD835\uDD16','sfrown':'\u2322','sharp':'\u266F','shchcy':'\u0449','SHCHcy':'\u0429','shcy':'\u0448','SHcy':'\u0428','ShortDownArrow':'\u2193','ShortLeftArrow':'\u2190','shortmid':'\u2223','shortparallel':'\u2225','ShortRightArrow':'\u2192','ShortUpArrow':'\u2191','shy':'\xAD','sigma':'\u03C3','Sigma':'\u03A3','sigmaf':'\u03C2','sigmav':'\u03C2','sim':'\u223C','simdot':'\u2A6A','sime':'\u2243','simeq':'\u2243','simg':'\u2A9E','simgE':'\u2AA0','siml':'\u2A9D','simlE':'\u2A9F','simne':'\u2246','simplus':'\u2A24','simrarr':'\u2972','slarr':'\u2190','SmallCircle':'\u2218','smallsetminus':'\u2216','smashp':'\u2A33','smeparsl':'\u29E4','smid':'\u2223','smile':'\u2323','smt':'\u2AAA','smte':'\u2AAC','smtes':'\u2AAC\uFE00','softcy':'\u044C','SOFTcy':'\u042C','sol':'/','solb':'\u29C4','solbar':'\u233F','sopf':'\uD835\uDD64','Sopf':'\uD835\uDD4A','spades':'\u2660','spadesuit':'\u2660','spar':'\u2225','sqcap':'\u2293','sqcaps':'\u2293\uFE00','sqcup':'\u2294','sqcups':'\u2294\uFE00','Sqrt':'\u221A','sqsub':'\u228F','sqsube':'\u2291','sqsubset':'\u228F','sqsubseteq':'\u2291','sqsup':'\u2290','sqsupe':'\u2292','sqsupset':'\u2290','sqsupseteq':'\u2292','squ':'\u25A1','square':'\u25A1','Square':'\u25A1','SquareIntersection':'\u2293','SquareSubset':'\u228F','SquareSubsetEqual':'\u2291','SquareSuperset':'\u2290','SquareSupersetEqual':'\u2292','SquareUnion':'\u2294','squarf':'\u25AA','squf':'\u25AA','srarr':'\u2192','sscr':'\uD835\uDCC8','Sscr':'\uD835\uDCAE','ssetmn':'\u2216','ssmile':'\u2323','sstarf':'\u22C6','star':'\u2606','Star':'\u22C6','starf':'\u2605','straightepsilon':'\u03F5','straightphi':'\u03D5','strns':'\xAF','sub':'\u2282','Sub':'\u22D0','subdot':'\u2ABD','sube':'\u2286','subE':'\u2AC5','subedot':'\u2AC3','submult':'\u2AC1','subne':'\u228A','subnE':'\u2ACB','subplus':'\u2ABF','subrarr':'\u2979','subset':'\u2282','Subset':'\u22D0','subseteq':'\u2286','subseteqq':'\u2AC5','SubsetEqual':'\u2286','subsetneq':'\u228A','subsetneqq':'\u2ACB','subsim':'\u2AC7','subsub':'\u2AD5','subsup':'\u2AD3','succ':'\u227B','succapprox':'\u2AB8','succcurlyeq':'\u227D','Succeeds':'\u227B','SucceedsEqual':'\u2AB0','SucceedsSlantEqual':'\u227D','SucceedsTilde':'\u227F','succeq':'\u2AB0','succnapprox':'\u2ABA','succneqq':'\u2AB6','succnsim':'\u22E9','succsim':'\u227F','SuchThat':'\u220B','sum':'\u2211','Sum':'\u2211','sung':'\u266A','sup':'\u2283','Sup':'\u22D1','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','supdot':'\u2ABE','supdsub':'\u2AD8','supe':'\u2287','supE':'\u2AC6','supedot':'\u2AC4','Superset':'\u2283','SupersetEqual':'\u2287','suphsol':'\u27C9','suphsub':'\u2AD7','suplarr':'\u297B','supmult':'\u2AC2','supne':'\u228B','supnE':'\u2ACC','supplus':'\u2AC0','supset':'\u2283','Supset':'\u22D1','supseteq':'\u2287','supseteqq':'\u2AC6','supsetneq':'\u228B','supsetneqq':'\u2ACC','supsim':'\u2AC8','supsub':'\u2AD4','supsup':'\u2AD6','swarhk':'\u2926','swarr':'\u2199','swArr':'\u21D9','swarrow':'\u2199','swnwar':'\u292A','szlig':'\xDF','Tab':'\t','target':'\u2316','tau':'\u03C4','Tau':'\u03A4','tbrk':'\u23B4','tcaron':'\u0165','Tcaron':'\u0164','tcedil':'\u0163','Tcedil':'\u0162','tcy':'\u0442','Tcy':'\u0422','tdot':'\u20DB','telrec':'\u2315','tfr':'\uD835\uDD31','Tfr':'\uD835\uDD17','there4':'\u2234','therefore':'\u2234','Therefore':'\u2234','theta':'\u03B8','Theta':'\u0398','thetasym':'\u03D1','thetav':'\u03D1','thickapprox':'\u2248','thicksim':'\u223C','ThickSpace':'\u205F\u200A','thinsp':'\u2009','ThinSpace':'\u2009','thkap':'\u2248','thksim':'\u223C','thorn':'\xFE','THORN':'\xDE','tilde':'\u02DC','Tilde':'\u223C','TildeEqual':'\u2243','TildeFullEqual':'\u2245','TildeTilde':'\u2248','times':'\xD7','timesb':'\u22A0','timesbar':'\u2A31','timesd':'\u2A30','tint':'\u222D','toea':'\u2928','top':'\u22A4','topbot':'\u2336','topcir':'\u2AF1','topf':'\uD835\uDD65','Topf':'\uD835\uDD4B','topfork':'\u2ADA','tosa':'\u2929','tprime':'\u2034','trade':'\u2122','TRADE':'\u2122','triangle':'\u25B5','triangledown':'\u25BF','triangleleft':'\u25C3','trianglelefteq':'\u22B4','triangleq':'\u225C','triangleright':'\u25B9','trianglerighteq':'\u22B5','tridot':'\u25EC','trie':'\u225C','triminus':'\u2A3A','TripleDot':'\u20DB','triplus':'\u2A39','trisb':'\u29CD','tritime':'\u2A3B','trpezium':'\u23E2','tscr':'\uD835\uDCC9','Tscr':'\uD835\uDCAF','tscy':'\u0446','TScy':'\u0426','tshcy':'\u045B','TSHcy':'\u040B','tstrok':'\u0167','Tstrok':'\u0166','twixt':'\u226C','twoheadleftarrow':'\u219E','twoheadrightarrow':'\u21A0','uacute':'\xFA','Uacute':'\xDA','uarr':'\u2191','uArr':'\u21D1','Uarr':'\u219F','Uarrocir':'\u2949','ubrcy':'\u045E','Ubrcy':'\u040E','ubreve':'\u016D','Ubreve':'\u016C','ucirc':'\xFB','Ucirc':'\xDB','ucy':'\u0443','Ucy':'\u0423','udarr':'\u21C5','udblac':'\u0171','Udblac':'\u0170','udhar':'\u296E','ufisht':'\u297E','ufr':'\uD835\uDD32','Ufr':'\uD835\uDD18','ugrave':'\xF9','Ugrave':'\xD9','uHar':'\u2963','uharl':'\u21BF','uharr':'\u21BE','uhblk':'\u2580','ulcorn':'\u231C','ulcorner':'\u231C','ulcrop':'\u230F','ultri':'\u25F8','umacr':'\u016B','Umacr':'\u016A','uml':'\xA8','UnderBar':'_','UnderBrace':'\u23DF','UnderBracket':'\u23B5','UnderParenthesis':'\u23DD','Union':'\u22C3','UnionPlus':'\u228E','uogon':'\u0173','Uogon':'\u0172','uopf':'\uD835\uDD66','Uopf':'\uD835\uDD4C','uparrow':'\u2191','Uparrow':'\u21D1','UpArrow':'\u2191','UpArrowBar':'\u2912','UpArrowDownArrow':'\u21C5','updownarrow':'\u2195','Updownarrow':'\u21D5','UpDownArrow':'\u2195','UpEquilibrium':'\u296E','upharpoonleft':'\u21BF','upharpoonright':'\u21BE','uplus':'\u228E','UpperLeftArrow':'\u2196','UpperRightArrow':'\u2197','upsi':'\u03C5','Upsi':'\u03D2','upsih':'\u03D2','upsilon':'\u03C5','Upsilon':'\u03A5','UpTee':'\u22A5','UpTeeArrow':'\u21A5','upuparrows':'\u21C8','urcorn':'\u231D','urcorner':'\u231D','urcrop':'\u230E','uring':'\u016F','Uring':'\u016E','urtri':'\u25F9','uscr':'\uD835\uDCCA','Uscr':'\uD835\uDCB0','utdot':'\u22F0','utilde':'\u0169','Utilde':'\u0168','utri':'\u25B5','utrif':'\u25B4','uuarr':'\u21C8','uuml':'\xFC','Uuml':'\xDC','uwangle':'\u29A7','vangrt':'\u299C','varepsilon':'\u03F5','varkappa':'\u03F0','varnothing':'\u2205','varphi':'\u03D5','varpi':'\u03D6','varpropto':'\u221D','varr':'\u2195','vArr':'\u21D5','varrho':'\u03F1','varsigma':'\u03C2','varsubsetneq':'\u228A\uFE00','varsubsetneqq':'\u2ACB\uFE00','varsupsetneq':'\u228B\uFE00','varsupsetneqq':'\u2ACC\uFE00','vartheta':'\u03D1','vartriangleleft':'\u22B2','vartriangleright':'\u22B3','vBar':'\u2AE8','Vbar':'\u2AEB','vBarv':'\u2AE9','vcy':'\u0432','Vcy':'\u0412','vdash':'\u22A2','vDash':'\u22A8','Vdash':'\u22A9','VDash':'\u22AB','Vdashl':'\u2AE6','vee':'\u2228','Vee':'\u22C1','veebar':'\u22BB','veeeq':'\u225A','vellip':'\u22EE','verbar':'|','Verbar':'\u2016','vert':'|','Vert':'\u2016','VerticalBar':'\u2223','VerticalLine':'|','VerticalSeparator':'\u2758','VerticalTilde':'\u2240','VeryThinSpace':'\u200A','vfr':'\uD835\uDD33','Vfr':'\uD835\uDD19','vltri':'\u22B2','vnsub':'\u2282\u20D2','vnsup':'\u2283\u20D2','vopf':'\uD835\uDD67','Vopf':'\uD835\uDD4D','vprop':'\u221D','vrtri':'\u22B3','vscr':'\uD835\uDCCB','Vscr':'\uD835\uDCB1','vsubne':'\u228A\uFE00','vsubnE':'\u2ACB\uFE00','vsupne':'\u228B\uFE00','vsupnE':'\u2ACC\uFE00','Vvdash':'\u22AA','vzigzag':'\u299A','wcirc':'\u0175','Wcirc':'\u0174','wedbar':'\u2A5F','wedge':'\u2227','Wedge':'\u22C0','wedgeq':'\u2259','weierp':'\u2118','wfr':'\uD835\uDD34','Wfr':'\uD835\uDD1A','wopf':'\uD835\uDD68','Wopf':'\uD835\uDD4E','wp':'\u2118','wr':'\u2240','wreath':'\u2240','wscr':'\uD835\uDCCC','Wscr':'\uD835\uDCB2','xcap':'\u22C2','xcirc':'\u25EF','xcup':'\u22C3','xdtri':'\u25BD','xfr':'\uD835\uDD35','Xfr':'\uD835\uDD1B','xharr':'\u27F7','xhArr':'\u27FA','xi':'\u03BE','Xi':'\u039E','xlarr':'\u27F5','xlArr':'\u27F8','xmap':'\u27FC','xnis':'\u22FB','xodot':'\u2A00','xopf':'\uD835\uDD69','Xopf':'\uD835\uDD4F','xoplus':'\u2A01','xotime':'\u2A02','xrarr':'\u27F6','xrArr':'\u27F9','xscr':'\uD835\uDCCD','Xscr':'\uD835\uDCB3','xsqcup':'\u2A06','xuplus':'\u2A04','xutri':'\u25B3','xvee':'\u22C1','xwedge':'\u22C0','yacute':'\xFD','Yacute':'\xDD','yacy':'\u044F','YAcy':'\u042F','ycirc':'\u0177','Ycirc':'\u0176','ycy':'\u044B','Ycy':'\u042B','yen':'\xA5','yfr':'\uD835\uDD36','Yfr':'\uD835\uDD1C','yicy':'\u0457','YIcy':'\u0407','yopf':'\uD835\uDD6A','Yopf':'\uD835\uDD50','yscr':'\uD835\uDCCE','Yscr':'\uD835\uDCB4','yucy':'\u044E','YUcy':'\u042E','yuml':'\xFF','Yuml':'\u0178','zacute':'\u017A','Zacute':'\u0179','zcaron':'\u017E','Zcaron':'\u017D','zcy':'\u0437','Zcy':'\u0417','zdot':'\u017C','Zdot':'\u017B','zeetrf':'\u2128','ZeroWidthSpace':'\u200B','zeta':'\u03B6','Zeta':'\u0396','zfr':'\uD835\uDD37','Zfr':'\u2128','zhcy':'\u0436','ZHcy':'\u0416','zigrarr':'\u21DD','zopf':'\uD835\uDD6B','Zopf':'\u2124','zscr':'\uD835\uDCCF','Zscr':'\uD835\uDCB5','zwj':'\u200D','zwnj':'\u200C'};
	var decodeMapLegacy = {'aacute':'\xE1','Aacute':'\xC1','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','aelig':'\xE6','AElig':'\xC6','agrave':'\xE0','Agrave':'\xC0','amp':'&','AMP':'&','aring':'\xE5','Aring':'\xC5','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','brvbar':'\xA6','ccedil':'\xE7','Ccedil':'\xC7','cedil':'\xB8','cent':'\xA2','copy':'\xA9','COPY':'\xA9','curren':'\xA4','deg':'\xB0','divide':'\xF7','eacute':'\xE9','Eacute':'\xC9','ecirc':'\xEA','Ecirc':'\xCA','egrave':'\xE8','Egrave':'\xC8','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','frac12':'\xBD','frac14':'\xBC','frac34':'\xBE','gt':'>','GT':'>','iacute':'\xED','Iacute':'\xCD','icirc':'\xEE','Icirc':'\xCE','iexcl':'\xA1','igrave':'\xEC','Igrave':'\xCC','iquest':'\xBF','iuml':'\xEF','Iuml':'\xCF','laquo':'\xAB','lt':'<','LT':'<','macr':'\xAF','micro':'\xB5','middot':'\xB7','nbsp':'\xA0','not':'\xAC','ntilde':'\xF1','Ntilde':'\xD1','oacute':'\xF3','Oacute':'\xD3','ocirc':'\xF4','Ocirc':'\xD4','ograve':'\xF2','Ograve':'\xD2','ordf':'\xAA','ordm':'\xBA','oslash':'\xF8','Oslash':'\xD8','otilde':'\xF5','Otilde':'\xD5','ouml':'\xF6','Ouml':'\xD6','para':'\xB6','plusmn':'\xB1','pound':'\xA3','quot':'"','QUOT':'"','raquo':'\xBB','reg':'\xAE','REG':'\xAE','sect':'\xA7','shy':'\xAD','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','szlig':'\xDF','thorn':'\xFE','THORN':'\xDE','times':'\xD7','uacute':'\xFA','Uacute':'\xDA','ucirc':'\xFB','Ucirc':'\xDB','ugrave':'\xF9','Ugrave':'\xD9','uml':'\xA8','uuml':'\xFC','Uuml':'\xDC','yacute':'\xFD','Yacute':'\xDD','yen':'\xA5','yuml':'\xFF'};
	var decodeMapNumeric = {'0':'\uFFFD','128':'\u20AC','130':'\u201A','131':'\u0192','132':'\u201E','133':'\u2026','134':'\u2020','135':'\u2021','136':'\u02C6','137':'\u2030','138':'\u0160','139':'\u2039','140':'\u0152','142':'\u017D','145':'\u2018','146':'\u2019','147':'\u201C','148':'\u201D','149':'\u2022','150':'\u2013','151':'\u2014','152':'\u02DC','153':'\u2122','154':'\u0161','155':'\u203A','156':'\u0153','158':'\u017E','159':'\u0178'};
	var invalidReferenceCodePoints = [1,2,3,4,5,6,7,8,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,64976,64977,64978,64979,64980,64981,64982,64983,64984,64985,64986,64987,64988,64989,64990,64991,64992,64993,64994,64995,64996,64997,64998,64999,65000,65001,65002,65003,65004,65005,65006,65007,65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111];

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	var object = {};
	var hasOwnProperty = object.hasOwnProperty;
	var has = function(object, propertyName) {
		return hasOwnProperty.call(object, propertyName);
	};

	var contains = function(array, value) {
		var index = -1;
		var length = array.length;
		while (++index < length) {
			if (array[index] == value) {
				return true;
			}
		}
		return false;
	};

	var merge = function(options, defaults) {
		if (!options) {
			return defaults;
		}
		var result = {};
		var key;
		for (key in defaults) {
			// A `hasOwnProperty` check is not needed here, since only recognized
			// option names are used anyway. Any others are ignored.
			result[key] = has(options, key) ? options[key] : defaults[key];
		}
		return result;
	};

	// Modified version of `ucs2encode`; see https://mths.be/punycode.
	var codePointToSymbol = function(codePoint, strict) {
		var output = '';
		if ((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF) {
			// See issue #4:
			// “Otherwise, if the number is in the range 0xD800 to 0xDFFF or is
			// greater than 0x10FFFF, then this is a parse error. Return a U+FFFD
			// REPLACEMENT CHARACTER.”
			if (strict) {
				parseError('character reference outside the permissible Unicode range');
			}
			return '\uFFFD';
		}
		if (has(decodeMapNumeric, codePoint)) {
			if (strict) {
				parseError('disallowed character reference');
			}
			return decodeMapNumeric[codePoint];
		}
		if (strict && contains(invalidReferenceCodePoints, codePoint)) {
			parseError('disallowed character reference');
		}
		if (codePoint > 0xFFFF) {
			codePoint -= 0x10000;
			output += stringFromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
			codePoint = 0xDC00 | codePoint & 0x3FF;
		}
		output += stringFromCharCode(codePoint);
		return output;
	};

	var hexEscape = function(codePoint) {
		return '&#x' + codePoint.toString(16).toUpperCase() + ';';
	};

	var decEscape = function(codePoint) {
		return '&#' + codePoint + ';';
	};

	var parseError = function(message) {
		throw Error('Parse error: ' + message);
	};

	/*--------------------------------------------------------------------------*/

	var encode = function(string, options) {
		options = merge(options, encode.options);
		var strict = options.strict;
		if (strict && regexInvalidRawCodePoint.test(string)) {
			parseError('forbidden code point');
		}
		var encodeEverything = options.encodeEverything;
		var useNamedReferences = options.useNamedReferences;
		var allowUnsafeSymbols = options.allowUnsafeSymbols;
		var escapeCodePoint = options.decimal ? decEscape : hexEscape;

		var escapeBmpSymbol = function(symbol) {
			return escapeCodePoint(symbol.charCodeAt(0));
		};

		if (encodeEverything) {
			// Encode ASCII symbols.
			string = string.replace(regexAsciiWhitelist, function(symbol) {
				// Use named references if requested & possible.
				if (useNamedReferences && has(encodeMap, symbol)) {
					return '&' + encodeMap[symbol] + ';';
				}
				return escapeBmpSymbol(symbol);
			});
			// Shorten a few escapes that represent two symbols, of which at least one
			// is within the ASCII range.
			if (useNamedReferences) {
				string = string
					.replace(/&gt;\u20D2/g, '&nvgt;')
					.replace(/&lt;\u20D2/g, '&nvlt;')
					.replace(/&#x66;&#x6A;/g, '&fjlig;');
			}
			// Encode non-ASCII symbols.
			if (useNamedReferences) {
				// Encode non-ASCII symbols that can be replaced with a named reference.
				string = string.replace(regexEncodeNonAscii, function(string) {
					// Note: there is no need to check `has(encodeMap, string)` here.
					return '&' + encodeMap[string] + ';';
				});
			}
			// Note: any remaining non-ASCII symbols are handled outside of the `if`.
		} else if (useNamedReferences) {
			// Apply named character references.
			// Encode `<>"'&` using named character references.
			if (!allowUnsafeSymbols) {
				string = string.replace(regexEscape, function(string) {
					return '&' + encodeMap[string] + ';'; // no need to check `has()` here
				});
			}
			// Shorten escapes that represent two symbols, of which at least one is
			// `<>"'&`.
			string = string
				.replace(/&gt;\u20D2/g, '&nvgt;')
				.replace(/&lt;\u20D2/g, '&nvlt;');
			// Encode non-ASCII symbols that can be replaced with a named reference.
			string = string.replace(regexEncodeNonAscii, function(string) {
				// Note: there is no need to check `has(encodeMap, string)` here.
				return '&' + encodeMap[string] + ';';
			});
		} else if (!allowUnsafeSymbols) {
			// Encode `<>"'&` using hexadecimal escapes, now that they’re not handled
			// using named character references.
			string = string.replace(regexEscape, escapeBmpSymbol);
		}
		return string
			// Encode astral symbols.
			.replace(regexAstralSymbols, function($0) {
				// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
				var high = $0.charCodeAt(0);
				var low = $0.charCodeAt(1);
				var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
				return escapeCodePoint(codePoint);
			})
			// Encode any remaining BMP symbols that are not printable ASCII symbols
			// using a hexadecimal escape.
			.replace(regexBmpWhitelist, escapeBmpSymbol);
	};
	// Expose default options (so they can be overridden globally).
	encode.options = {
		'allowUnsafeSymbols': false,
		'encodeEverything': false,
		'strict': false,
		'useNamedReferences': false,
		'decimal' : false
	};

	var decode = function(html, options) {
		options = merge(options, decode.options);
		var strict = options.strict;
		if (strict && regexInvalidEntity.test(html)) {
			parseError('malformed character reference');
		}
		return html.replace(regexDecode, function($0, $1, $2, $3, $4, $5, $6, $7, $8) {
			var codePoint;
			var semicolon;
			var decDigits;
			var hexDigits;
			var reference;
			var next;

			if ($1) {
				reference = $1;
				// Note: there is no need to check `has(decodeMap, reference)`.
				return decodeMap[reference];
			}

			if ($2) {
				// Decode named character references without trailing `;`, e.g. `&amp`.
				// This is only a parse error if it gets converted to `&`, or if it is
				// followed by `=` in an attribute context.
				reference = $2;
				next = $3;
				if (next && options.isAttributeValue) {
					if (strict && next == '=') {
						parseError('`&` did not start a character reference');
					}
					return $0;
				} else {
					if (strict) {
						parseError(
							'named character reference was not terminated by a semicolon'
						);
					}
					// Note: there is no need to check `has(decodeMapLegacy, reference)`.
					return decodeMapLegacy[reference] + (next || '');
				}
			}

			if ($4) {
				// Decode decimal escapes, e.g. `&#119558;`.
				decDigits = $4;
				semicolon = $5;
				if (strict && !semicolon) {
					parseError('character reference was not terminated by a semicolon');
				}
				codePoint = parseInt(decDigits, 10);
				return codePointToSymbol(codePoint, strict);
			}

			if ($6) {
				// Decode hexadecimal escapes, e.g. `&#x1D306;`.
				hexDigits = $6;
				semicolon = $7;
				if (strict && !semicolon) {
					parseError('character reference was not terminated by a semicolon');
				}
				codePoint = parseInt(hexDigits, 16);
				return codePointToSymbol(codePoint, strict);
			}

			// If we’re still here, `if ($7)` is implied; it’s an ambiguous
			// ampersand for sure. https://mths.be/notes/ambiguous-ampersands
			if (strict) {
				parseError(
					'named character reference was not terminated by a semicolon'
				);
			}
			return $0;
		});
	};
	// Expose default options (so they can be overridden globally).
	decode.options = {
		'isAttributeValue': false,
		'strict': false
	};

	var escape = function(string) {
		return string.replace(regexEscape, function($0) {
			// Note: there is no need to check `has(escapeMap, $0)` here.
			return escapeMap[$0];
		});
	};

	/*--------------------------------------------------------------------------*/

	var he = {
		'version': '1.2.0',
		'encode': encode,
		'decode': decode,
		'escape': escape,
		'unescape': decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = he;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in he) {
				has(he, key) && (freeExports[key] = he[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.he = he;
	}

}(commonjsGlobal));
});

var toStr = Object.prototype.toString;

var isArguments = function isArguments(value) {
	var str = toStr.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

var keysShim;
if (!Object.keys) {
	// modified from https://github.com/es-shims/es5-shim
	var has = Object.prototype.hasOwnProperty;
	var toStr$1 = Object.prototype.toString;
	var isArgs = isArguments; // eslint-disable-line global-require
	var isEnumerable = Object.prototype.propertyIsEnumerable;
	var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
	var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
	var dontEnums = [
		'toString',
		'toLocaleString',
		'valueOf',
		'hasOwnProperty',
		'isPrototypeOf',
		'propertyIsEnumerable',
		'constructor'
	];
	var equalsConstructorPrototype = function (o) {
		var ctor = o.constructor;
		return ctor && ctor.prototype === o;
	};
	var excludedKeys = {
		$applicationCache: true,
		$console: true,
		$external: true,
		$frame: true,
		$frameElement: true,
		$frames: true,
		$innerHeight: true,
		$innerWidth: true,
		$onmozfullscreenchange: true,
		$onmozfullscreenerror: true,
		$outerHeight: true,
		$outerWidth: true,
		$pageXOffset: true,
		$pageYOffset: true,
		$parent: true,
		$scrollLeft: true,
		$scrollTop: true,
		$scrollX: true,
		$scrollY: true,
		$self: true,
		$webkitIndexedDB: true,
		$webkitStorageInfo: true,
		$window: true
	};
	var hasAutomationEqualityBug = (function () {
		/* global window */
		if (typeof window === 'undefined') { return false; }
		for (var k in window) {
			try {
				if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
					try {
						equalsConstructorPrototype(window[k]);
					} catch (e) {
						return true;
					}
				}
			} catch (e) {
				return true;
			}
		}
		return false;
	}());
	var equalsConstructorPrototypeIfNotBuggy = function (o) {
		/* global window */
		if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
			return equalsConstructorPrototype(o);
		}
		try {
			return equalsConstructorPrototype(o);
		} catch (e) {
			return false;
		}
	};

	keysShim = function keys(object) {
		var isObject = object !== null && typeof object === 'object';
		var isFunction = toStr$1.call(object) === '[object Function]';
		var isArguments = isArgs(object);
		var isString = isObject && toStr$1.call(object) === '[object String]';
		var theKeys = [];

		if (!isObject && !isFunction && !isArguments) {
			throw new TypeError('Object.keys called on a non-object');
		}

		var skipProto = hasProtoEnumBug && isFunction;
		if (isString && object.length > 0 && !has.call(object, 0)) {
			for (var i = 0; i < object.length; ++i) {
				theKeys.push(String(i));
			}
		}

		if (isArguments && object.length > 0) {
			for (var j = 0; j < object.length; ++j) {
				theKeys.push(String(j));
			}
		} else {
			for (var name in object) {
				if (!(skipProto && name === 'prototype') && has.call(object, name)) {
					theKeys.push(String(name));
				}
			}
		}

		if (hasDontEnumBug) {
			var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

			for (var k = 0; k < dontEnums.length; ++k) {
				if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
					theKeys.push(dontEnums[k]);
				}
			}
		}
		return theKeys;
	};
}
var implementation = keysShim;

var slice = Array.prototype.slice;


var origKeys = Object.keys;
var keysShim$1 = origKeys ? function keys(o) { return origKeys(o); } : implementation;

var originalKeys = Object.keys;

keysShim$1.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			var args = Object.keys(arguments);
			return args && args.length === arguments.length;
		}(1, 2));
		if (!keysWorksWithArguments) {
			Object.keys = function keys(object) { // eslint-disable-line func-name-matching
				if (isArguments(object)) {
					return originalKeys(slice.call(object));
				}
				return originalKeys(object);
			};
		}
	} else {
		Object.keys = keysShim$1;
	}
	return Object.keys || keysShim$1;
};

var objectKeys = keysShim$1;

var hasSymbols = typeof Symbol === 'function' && typeof Symbol('foo') === 'symbol';

var toStr$2 = Object.prototype.toString;
var concat = Array.prototype.concat;
var origDefineProperty = Object.defineProperty;

var isFunction = function (fn) {
	return typeof fn === 'function' && toStr$2.call(fn) === '[object Function]';
};

var arePropertyDescriptorsSupported = function () {
	var obj = {};
	try {
		origDefineProperty(obj, 'x', { enumerable: false, value: obj });
		// eslint-disable-next-line no-unused-vars, no-restricted-syntax
		for (var _ in obj) { // jscs:ignore disallowUnusedVariables
			return false;
		}
		return obj.x === obj;
	} catch (e) { /* this is IE 8. */
		return false;
	}
};
var supportsDescriptors = origDefineProperty && arePropertyDescriptorsSupported();

var defineProperty = function (object, name, value, predicate) {
	if (name in object && (!isFunction(predicate) || !predicate())) {
		return;
	}
	if (supportsDescriptors) {
		origDefineProperty(object, name, {
			configurable: true,
			enumerable: false,
			value: value,
			writable: true
		});
	} else {
		object[name] = value;
	}
};

var defineProperties = function (object, map) {
	var predicates = arguments.length > 2 ? arguments[2] : {};
	var props = objectKeys(map);
	if (hasSymbols) {
		props = concat.call(props, Object.getOwnPropertySymbols(map));
	}
	for (var i = 0; i < props.length; i += 1) {
		defineProperty(object, props[i], map[props[i]], predicates[props[i]]);
	}
};

defineProperties.supportsDescriptors = !!supportsDescriptors;

var defineProperties_1 = defineProperties;

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice$1 = Array.prototype.slice;
var toStr$3 = Object.prototype.toString;
var funcType = '[object Function]';

var implementation$1 = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr$3.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice$1.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice$1.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice$1.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

var functionBind = Function.prototype.bind || implementation$1;

/* eslint complexity: [2, 18], max-statements: [2, 33] */
var shams = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

// modified from https://github.com/es-shims/es6-shim


var canBeObject = function (obj) {
	return typeof obj !== 'undefined' && obj !== null;
};
var hasSymbols$1 = shams();
var toObject = Object;
var push = functionBind.call(Function.call, Array.prototype.push);
var propIsEnumerable = functionBind.call(Function.call, Object.prototype.propertyIsEnumerable);
var originalGetSymbols = hasSymbols$1 ? Object.getOwnPropertySymbols : null;

var implementation$2 = function assign(target, source1) {
	if (!canBeObject(target)) { throw new TypeError('target must be an object'); }
	var objTarget = toObject(target);
	var s, source, i, props, syms, value, key;
	for (s = 1; s < arguments.length; ++s) {
		source = toObject(arguments[s]);
		props = objectKeys(source);
		var getSymbols = hasSymbols$1 && (Object.getOwnPropertySymbols || originalGetSymbols);
		if (getSymbols) {
			syms = getSymbols(source);
			for (i = 0; i < syms.length; ++i) {
				key = syms[i];
				if (propIsEnumerable(source, key)) {
					push(props, key);
				}
			}
		}
		for (i = 0; i < props.length; ++i) {
			key = props[i];
			value = source[key];
			if (propIsEnumerable(source, key)) {
				objTarget[key] = value;
			}
		}
	}
	return objTarget;
};

var lacksProperEnumerationOrder = function () {
	if (!Object.assign) {
		return false;
	}
	// v8, specifically in node 4.x, has a bug with incorrect property enumeration order
	// note: this does not detect the bug unless there's 20 characters
	var str = 'abcdefghijklmnopqrst';
	var letters = str.split('');
	var map = {};
	for (var i = 0; i < letters.length; ++i) {
		map[letters[i]] = letters[i];
	}
	var obj = Object.assign({}, map);
	var actual = '';
	for (var k in obj) {
		actual += k;
	}
	return str !== actual;
};

var assignHasPendingExceptions = function () {
	if (!Object.assign || !Object.preventExtensions) {
		return false;
	}
	// Firefox 37 still has "pending exception" logic in its Object.assign implementation,
	// which is 72% slower than our shim, and Firefox 40's native implementation.
	var thrower = Object.preventExtensions({ 1: 2 });
	try {
		Object.assign(thrower, 'xy');
	} catch (e) {
		return thrower[1] === 'y';
	}
	return false;
};

var polyfill = function getPolyfill() {
	if (!Object.assign) {
		return implementation$2;
	}
	if (lacksProperEnumerationOrder()) {
		return implementation$2;
	}
	if (assignHasPendingExceptions()) {
		return implementation$2;
	}
	return Object.assign;
};

var shim = function shimAssign() {
	var polyfill$1 = polyfill();
	defineProperties_1(
		Object,
		{ assign: polyfill$1 },
		{ assign: function () { return Object.assign !== polyfill$1; } }
	);
	return polyfill$1;
};

var polyfill$1 = polyfill();

defineProperties_1(polyfill$1, {
	getPolyfill: polyfill,
	implementation: implementation$2,
	shim: shim
});

var object_assign = polyfill$1;

var utils = createCommonjsModule(function (module, exports) {

/**
 * Various utility functions used throughout Mocha's codebase.
 * @module utils
 */

/**
 * Module dependencies.
 */





var assign = (exports.assign = object_assign.getPolyfill());

/**
 * Inherit the prototype methods from one constructor into another.
 *
 * @param {function} ctor - Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor - Constructor function to inherit prototype from.
 * @throws {TypeError} if either constructor is null, or if super constructor
 *     lacks a prototype.
 */
exports.inherits = util.inherits;

/**
 * Escape special characters in the given string of html.
 *
 * @private
 * @param  {string} html
 * @return {string}
 */
exports.escape = function(html) {
  return he.encode(String(html), {useNamedReferences: false});
};

/**
 * Test if the given obj is type of string.
 *
 * @private
 * @param {Object} obj
 * @return {boolean}
 */
exports.isString = function(obj) {
  return typeof obj === 'string';
};

/**
 * Compute a slug from the given `str`.
 *
 * @private
 * @param {string} str
 * @return {string}
 */
exports.slug = function(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^-\w]/g, '')
    .replace(/-{2,}/g, '-');
};

/**
 * Strip the function definition from `str`, and re-indent for pre whitespace.
 *
 * @param {string} str
 * @return {string}
 */
exports.clean = function(str) {
  str = str
    .replace(/\r\n?|[\n\u2028\u2029]/g, '\n')
    .replace(/^\uFEFF/, '')
    // (traditional)->  space/name     parameters    body     (lambda)-> parameters       body   multi-statement/single          keep body content
    .replace(
      /^function(?:\s*|\s+[^(]*)\([^)]*\)\s*\{((?:.|\n)*?)\s*\}$|^\([^)]*\)\s*=>\s*(?:\{((?:.|\n)*?)\s*\}|((?:.|\n)*))$/,
      '$1$2$3'
    );

  var spaces = str.match(/^\n?( *)/)[1].length;
  var tabs = str.match(/^\n?(\t*)/)[1].length;
  var re = new RegExp(
    '^\n?' + (tabs ? '\t' : ' ') + '{' + (tabs || spaces) + '}',
    'gm'
  );

  str = str.replace(re, '');

  return str.trim();
};

/**
 * If a value could have properties, and has none, this function is called,
 * which returns a string representation of the empty value.
 *
 * Functions w/ no properties return `'[Function]'`
 * Arrays w/ length === 0 return `'[]'`
 * Objects w/ no properties return `'{}'`
 * All else: return result of `value.toString()`
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {string} typeHint The type of the value
 * @returns {string}
 */
function emptyRepresentation(value, typeHint) {
  switch (typeHint) {
    case 'function':
      return '[Function]';
    case 'object':
      return '{}';
    case 'array':
      return '[]';
    default:
      return value.toString();
  }
}

/**
 * Takes some variable and asks `Object.prototype.toString()` what it thinks it
 * is.
 *
 * @private
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString
 * @param {*} value The value to test.
 * @returns {string} Computed type
 * @example
 * type({}) // 'object'
 * type([]) // 'array'
 * type(1) // 'number'
 * type(false) // 'boolean'
 * type(Infinity) // 'number'
 * type(null) // 'null'
 * type(new Date()) // 'date'
 * type(/foo/) // 'regexp'
 * type('type') // 'string'
 * type(global) // 'global'
 * type(new String('foo') // 'object'
 */
var type = (exports.type = function type(value) {
  if (value === undefined) {
    return 'undefined';
  } else if (value === null) {
    return 'null';
  } else if (Buffer.isBuffer(value)) {
    return 'buffer';
  }
  return Object.prototype.toString
    .call(value)
    .replace(/^\[.+\s(.+?)]$/, '$1')
    .toLowerCase();
});

/**
 * Stringify `value`. Different behavior depending on type of value:
 *
 * - If `value` is undefined or null, return `'[undefined]'` or `'[null]'`, respectively.
 * - If `value` is not an object, function or array, return result of `value.toString()` wrapped in double-quotes.
 * - If `value` is an *empty* object, function, or array, return result of function
 *   {@link emptyRepresentation}.
 * - If `value` has properties, call {@link exports.canonicalize} on it, then return result of
 *   JSON.stringify().
 *
 * @private
 * @see exports.type
 * @param {*} value
 * @return {string}
 */
exports.stringify = function(value) {
  var typeHint = type(value);

  if (!~['object', 'array', 'function'].indexOf(typeHint)) {
    if (typeHint === 'buffer') {
      var json = Buffer.prototype.toJSON.call(value);
      // Based on the toJSON result
      return jsonStringify(
        json.data && json.type ? json.data : json,
        2
      ).replace(/,(\n|$)/g, '$1');
    }

    // IE7/IE8 has a bizarre String constructor; needs to be coerced
    // into an array and back to obj.
    if (typeHint === 'string' && typeof value === 'object') {
      value = value.split('').reduce(function(acc, char, idx) {
        acc[idx] = char;
        return acc;
      }, {});
      typeHint = 'object';
    } else {
      return jsonStringify(value);
    }
  }

  for (var prop in value) {
    if (Object.prototype.hasOwnProperty.call(value, prop)) {
      return jsonStringify(
        exports.canonicalize(value, null, typeHint),
        2
      ).replace(/,(\n|$)/g, '$1');
    }
  }

  return emptyRepresentation(value, typeHint);
};

/**
 * like JSON.stringify but more sense.
 *
 * @private
 * @param {Object}  object
 * @param {number=} spaces
 * @param {number=} depth
 * @returns {*}
 */
function jsonStringify(object, spaces, depth) {
  if (typeof spaces === 'undefined') {
    // primitive types
    return _stringify(object);
  }

  depth = depth || 1;
  var space = spaces * depth;
  var str = Array.isArray(object) ? '[' : '{';
  var end = Array.isArray(object) ? ']' : '}';
  var length =
    typeof object.length === 'number'
      ? object.length
      : Object.keys(object).length;
  // `.repeat()` polyfill
  function repeat(s, n) {
    return new Array(n).join(s);
  }

  function _stringify(val) {
    switch (type(val)) {
      case 'null':
      case 'undefined':
        val = '[' + val + ']';
        break;
      case 'array':
      case 'object':
        val = jsonStringify(val, spaces, depth + 1);
        break;
      case 'boolean':
      case 'regexp':
      case 'symbol':
      case 'number':
        val =
          val === 0 && 1 / val === -Infinity // `-0`
            ? '-0'
            : val.toString();
        break;
      case 'date':
        var sDate = isNaN(val.getTime()) ? val.toString() : val.toISOString();
        val = '[Date: ' + sDate + ']';
        break;
      case 'buffer':
        var json = val.toJSON();
        // Based on the toJSON result
        json = json.data && json.type ? json.data : json;
        val = '[Buffer: ' + jsonStringify(json, 2, depth + 1) + ']';
        break;
      default:
        val =
          val === '[Function]' || val === '[Circular]'
            ? val
            : JSON.stringify(val); // string
    }
    return val;
  }

  for (var i in object) {
    if (!Object.prototype.hasOwnProperty.call(object, i)) {
      continue; // not my business
    }
    --length;
    str +=
      '\n ' +
      repeat(' ', space) +
      (Array.isArray(object) ? '' : '"' + i + '": ') + // key
      _stringify(object[i]) + // value
      (length ? ',' : ''); // comma
  }

  return (
    str +
    // [], {}
    (str.length !== 1 ? '\n' + repeat(' ', --space) + end : end)
  );
}

/**
 * Return a new Thing that has the keys in sorted order. Recursive.
 *
 * If the Thing...
 * - has already been seen, return string `'[Circular]'`
 * - is `undefined`, return string `'[undefined]'`
 * - is `null`, return value `null`
 * - is some other primitive, return the value
 * - is not a primitive or an `Array`, `Object`, or `Function`, return the value of the Thing's `toString()` method
 * - is a non-empty `Array`, `Object`, or `Function`, return the result of calling this function again.
 * - is an empty `Array`, `Object`, or `Function`, return the result of calling `emptyRepresentation()`
 *
 * @private
 * @see {@link exports.stringify}
 * @param {*} value Thing to inspect.  May or may not have properties.
 * @param {Array} [stack=[]] Stack of seen values
 * @param {string} [typeHint] Type hint
 * @return {(Object|Array|Function|string|undefined)}
 */
exports.canonicalize = function canonicalize(value, stack, typeHint) {
  var canonicalizedObj;
  /* eslint-disable no-unused-vars */
  var prop;
  /* eslint-enable no-unused-vars */
  typeHint = typeHint || type(value);
  function withStack(value, fn) {
    stack.push(value);
    fn();
    stack.pop();
  }

  stack = stack || [];

  if (stack.indexOf(value) !== -1) {
    return '[Circular]';
  }

  switch (typeHint) {
    case 'undefined':
    case 'buffer':
    case 'null':
      canonicalizedObj = value;
      break;
    case 'array':
      withStack(value, function() {
        canonicalizedObj = value.map(function(item) {
          return exports.canonicalize(item, stack);
        });
      });
      break;
    case 'function':
      /* eslint-disable guard-for-in */
      for (prop in value) {
        canonicalizedObj = {};
        break;
      }
      /* eslint-enable guard-for-in */
      if (!canonicalizedObj) {
        canonicalizedObj = emptyRepresentation(value, typeHint);
        break;
      }
    /* falls through */
    case 'object':
      canonicalizedObj = canonicalizedObj || {};
      withStack(value, function() {
        Object.keys(value)
          .sort()
          .forEach(function(key) {
            canonicalizedObj[key] = exports.canonicalize(value[key], stack);
          });
      });
      break;
    case 'date':
    case 'number':
    case 'regexp':
    case 'boolean':
    case 'symbol':
      canonicalizedObj = value;
      break;
    default:
      canonicalizedObj = value + '';
  }

  return canonicalizedObj;
};

/**
 * process.emitWarning or a polyfill
 * @see https://nodejs.org/api/process.html#process_process_emitwarning_warning_options
 * @ignore
 */
function emitWarning(msg, type) {
  if (process.emitWarning) {
    process.emitWarning(msg, type);
  } else {
    process.nextTick(function() {
      console.warn(type + ': ' + msg);
    });
  }
}

/**
 * Show a deprecation warning. Each distinct message is only displayed once.
 * Ignores empty messages.
 *
 * @param {string} [msg] - Warning to print
 * @private
 */
exports.deprecate = function deprecate(msg) {
  msg = String(msg);
  if (msg && !deprecate.cache[msg]) {
    deprecate.cache[msg] = true;
    emitWarning(msg, 'DeprecationWarning');
  }
};
exports.deprecate.cache = {};

/**
 * Show a generic warning.
 * Ignores empty messages.
 *
 * @param {string} [msg] - Warning to print
 * @private
 */
exports.warn = function warn(msg) {
  if (msg) {
    emitWarning(msg);
  }
};

/**
 * @summary
 * This Filter based on `mocha-clean` module.(see: `github.com/rstacruz/mocha-clean`)
 * @description
 * When invoking this function you get a filter function that get the Error.stack as an input,
 * and return a prettify output.
 * (i.e: strip Mocha and internal node functions from stack trace).
 * @returns {Function}
 */
exports.stackTraceFilter = function() {
  // TODO: Replace with `process.browser`
  var is = typeof document === 'undefined' ? {node: true} : {browser: true};
  var slash = path.sep;
  var cwd;
  if (is.node) {
    cwd = exports.cwd() + slash;
  } else {
    cwd = (typeof location === 'undefined'
      ? window.location
      : location
    ).href.replace(/\/[^/]*$/, '/');
    slash = '/';
  }

  function isMochaInternal(line) {
    return (
      ~line.indexOf('node_modules' + slash + 'mocha' + slash) ||
      ~line.indexOf(slash + 'mocha.js') ||
      ~line.indexOf(slash + 'mocha.min.js')
    );
  }

  function isNodeInternal(line) {
    return (
      ~line.indexOf('(timers.js:') ||
      ~line.indexOf('(events.js:') ||
      ~line.indexOf('(node.js:') ||
      ~line.indexOf('(module.js:') ||
      ~line.indexOf('GeneratorFunctionPrototype.next (native)') ||
      false
    );
  }

  return function(stack) {
    stack = stack.split('\n');

    stack = stack.reduce(function(list, line) {
      if (isMochaInternal(line)) {
        return list;
      }

      if (is.node && isNodeInternal(line)) {
        return list;
      }

      // Clean up cwd(absolute)
      if (/:\d+:\d+\)?$/.test(line)) {
        line = line.replace('(' + cwd, '(');
      }

      list.push(line);
      return list;
    }, []);

    return stack.join('\n');
  };
};

/**
 * Crude, but effective.
 * @public
 * @param {*} value
 * @returns {boolean} Whether or not `value` is a Promise
 */
exports.isPromise = function isPromise(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.then === 'function'
  );
};

/**
 * Clamps a numeric value to an inclusive range.
 *
 * @param {number} value - Value to be clamped.
 * @param {numer[]} range - Two element array specifying [min, max] range.
 * @returns {number} clamped value
 */
exports.clamp = function clamp(value, range) {
  return Math.min(Math.max(value, range[0]), range[1]);
};

/**
 * Single quote text by combining with undirectional ASCII quotation marks.
 *
 * @description
 * Provides a simple means of markup for quoting text to be used in output.
 * Use this to quote names of variables, methods, and packages.
 *
 * <samp>package 'foo' cannot be found</samp>
 *
 * @private
 * @param {string} str - Value to be quoted.
 * @returns {string} quoted value
 * @example
 * sQuote('n') // => 'n'
 */
exports.sQuote = function(str) {
  return "'" + str + "'";
};

/**
 * Double quote text by combining with undirectional ASCII quotation marks.
 *
 * @description
 * Provides a simple means of markup for quoting text to be used in output.
 * Use this to quote names of datatypes, classes, pathnames, and strings.
 *
 * <samp>argument 'value' must be "string" or "number"</samp>
 *
 * @private
 * @param {string} str - Value to be quoted.
 * @returns {string} quoted value
 * @example
 * dQuote('number') // => "number"
 */
exports.dQuote = function(str) {
  return '"' + str + '"';
};

/**
 * It's a noop.
 * @public
 */
exports.noop = function() {};

/**
 * Creates a map-like object.
 *
 * @description
 * A "map" is an object with no prototype, for our purposes. In some cases
 * this would be more appropriate than a `Map`, especially if your environment
 * doesn't support it. Recommended for use in Mocha's public APIs.
 *
 * @public
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map|MDN:Map}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create#Custom_and_Null_objects|MDN:Object.create - Custom objects}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign|MDN:Object.assign}
 * @param {...*} [obj] - Arguments to `Object.assign()`.
 * @returns {Object} An object with no prototype, having `...obj` properties
 */
exports.createMap = function(obj) {
  return assign.apply(
    null,
    [Object.create(null)].concat(Array.prototype.slice.call(arguments))
  );
};

/**
 * Creates a read-only map-like object.
 *
 * @description
 * This differs from {@link module:utils.createMap createMap} only in that
 * the argument must be non-empty, because the result is frozen.
 *
 * @see {@link module:utils.createMap createMap}
 * @param {...*} [obj] - Arguments to `Object.assign()`.
 * @returns {Object} A frozen object with no prototype, having `...obj` properties
 * @throws {TypeError} if argument is not a non-empty object.
 */
exports.defineConstants = function(obj) {
  if (type(obj) !== 'object' || !Object.keys(obj).length) {
    throw new TypeError('Invalid argument; expected a non-empty object');
  }
  return Object.freeze(exports.createMap(obj));
};

/**
 * Whether current version of Node support ES modules
 *
 * @description
 * Versions prior to 10 did not support ES Modules, and version 10 has an old incompatible version of ESM.
 * This function returns whether Node.JS has ES Module supports that is compatible with Mocha's needs,
 * which is version >=12.11.
 *
 * @param {partialSupport} whether the full Node.js ESM support is available (>= 12) or just something that supports the runtime (>= 10)
 *
 * @returns {Boolean} whether the current version of Node.JS supports ES Modules in a way that is compatible with Mocha
 */
exports.supportsEsModules = function(partialSupport) {
  if (!exports.isBrowser() && process.versions && process.versions.node) {
    var versionFields = process.versions.node.split('.');
    var major = +versionFields[0];
    var minor = +versionFields[1];

    if (!partialSupport) {
      return major >= 13 || (major === 12 && minor >= 11);
    } else {
      return major >= 10;
    }
  }
};

/**
 * Returns current working directory
 *
 * Wrapper around `process.cwd()` for isolation
 * @private
 */
exports.cwd = function cwd() {
  return process.cwd();
};

/**
 * Returns `true` if Mocha is running in a browser.
 * Checks for `process.browser`.
 * @returns {boolean}
 * @private
 */
exports.isBrowser = function isBrowser() {
  return Boolean(process.browser);
};
});

var hasFlag = (flag, argv = process.argv) => {
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const position = argv.indexOf(prefix + flag);
	const terminatorPosition = argv.indexOf('--');
	return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
};

const {env} = process;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false') ||
	hasFlag('color=never')) {
	forceColor = 0;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = 1;
}

if ('FORCE_COLOR' in env) {
	if (env.FORCE_COLOR === 'true') {
		forceColor = 1;
	} else if (env.FORCE_COLOR === 'false') {
		forceColor = 0;
	} else {
		forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
	}
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(haveStream, streamIsTTY) {
	if (forceColor === 0) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (haveStream && !streamIsTTY && forceColor === undefined) {
		return 0;
	}

	const min = forceColor || 0;

	if (env.TERM === 'dumb') {
		return min;
	}

	if (process.platform === 'win32') {
		// Windows 10 build 10586 is the first Windows release that supports 256 colors.
		// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
		const osRelease = os.release().split('.');
		if (
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if ('GITHUB_ACTIONS' in env) {
		return 1;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream, stream && stream.isTTY);
	return translateLevel(level);
}

var supportsColor_1 = {
	supportsColor: getSupportLevel,
	stdout: translateLevel(supportsColor(true, tty.isatty(1))),
	stderr: translateLevel(supportsColor(true, tty.isatty(2)))
};

/**
 @module Pending
*/

var pending = Pending;

/**
 * Initialize a new `Pending` error with the given message.
 *
 * @param {string} message
 */
function Pending(message) {
  this.message = message;
}

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */
function setup(env) {
  createDebug.debug = createDebug;
  createDebug.default = createDebug;
  createDebug.coerce = coerce;
  createDebug.disable = disable;
  createDebug.enable = enable;
  createDebug.enabled = enabled;
  createDebug.humanize = ms;
  Object.keys(env).forEach(function (key) {
    createDebug[key] = env[key];
  });
  /**
  * Active `debug` instances.
  */

  createDebug.instances = [];
  /**
  * The currently active debug mode names, and names to skip.
  */

  createDebug.names = [];
  createDebug.skips = [];
  /**
  * Map of special "%n" handling functions, for the debug "format" argument.
  *
  * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
  */

  createDebug.formatters = {};
  /**
  * Selects a color for a debug namespace
  * @param {String} namespace The namespace string for the for the debug instance to be colored
  * @return {Number|String} An ANSI color code for the given namespace
  * @api private
  */

  function selectColor(namespace) {
    var hash = 0;

    for (var i = 0; i < namespace.length; i++) {
      hash = (hash << 5) - hash + namespace.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
  }

  createDebug.selectColor = selectColor;
  /**
  * Create a debugger with the given `namespace`.
  *
  * @param {String} namespace
  * @return {Function}
  * @api public
  */

  function createDebug(namespace) {
    var prevTime;

    function debug() {
      // Disabled?
      if (!debug.enabled) {
        return;
      }

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var self = debug; // Set `diff` timestamp

      var curr = Number(new Date());
      var ms = curr - (prevTime || curr);
      self.diff = ms;
      self.prev = prevTime;
      self.curr = curr;
      prevTime = curr;
      args[0] = createDebug.coerce(args[0]);

      if (typeof args[0] !== 'string') {
        // Anything else let's inspect with %O
        args.unshift('%O');
      } // Apply any `formatters` transformations


      var index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, function (match, format) {
        // If we encounter an escaped % then don't increase the array index
        if (match === '%%') {
          return match;
        }

        index++;
        var formatter = createDebug.formatters[format];

        if (typeof formatter === 'function') {
          var val = args[index];
          match = formatter.call(self, val); // Now we need to remove `args[index]` since it's inlined in the `format`

          args.splice(index, 1);
          index--;
        }

        return match;
      }); // Apply env-specific formatting (colors, etc.)

      createDebug.formatArgs.call(self, args);
      var logFn = self.log || createDebug.log;
      logFn.apply(self, args);
    }

    debug.namespace = namespace;
    debug.enabled = createDebug.enabled(namespace);
    debug.useColors = createDebug.useColors();
    debug.color = selectColor(namespace);
    debug.destroy = destroy;
    debug.extend = extend; // Debug.formatArgs = formatArgs;
    // debug.rawLog = rawLog;
    // env-specific initialization logic for debug instances

    if (typeof createDebug.init === 'function') {
      createDebug.init(debug);
    }

    createDebug.instances.push(debug);
    return debug;
  }

  function destroy() {
    var index = createDebug.instances.indexOf(this);

    if (index !== -1) {
      createDebug.instances.splice(index, 1);
      return true;
    }

    return false;
  }

  function extend(namespace, delimiter) {
    return createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
  }
  /**
  * Enables a debug mode by namespaces. This can include modes
  * separated by a colon and wildcards.
  *
  * @param {String} namespaces
  * @api public
  */


  function enable(namespaces) {
    createDebug.save(namespaces);
    createDebug.names = [];
    createDebug.skips = [];
    var i;
    var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    var len = split.length;

    for (i = 0; i < len; i++) {
      if (!split[i]) {
        // ignore empty strings
        continue;
      }

      namespaces = split[i].replace(/\*/g, '.*?');

      if (namespaces[0] === '-') {
        createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
      } else {
        createDebug.names.push(new RegExp('^' + namespaces + '$'));
      }
    }

    for (i = 0; i < createDebug.instances.length; i++) {
      var instance = createDebug.instances[i];
      instance.enabled = createDebug.enabled(instance.namespace);
    }
  }
  /**
  * Disable debug output.
  *
  * @api public
  */


  function disable() {
    createDebug.enable('');
  }
  /**
  * Returns true if the given mode name is enabled, false otherwise.
  *
  * @param {String} name
  * @return {Boolean}
  * @api public
  */


  function enabled(name) {
    if (name[name.length - 1] === '*') {
      return true;
    }

    var i;
    var len;

    for (i = 0, len = createDebug.skips.length; i < len; i++) {
      if (createDebug.skips[i].test(name)) {
        return false;
      }
    }

    for (i = 0, len = createDebug.names.length; i < len; i++) {
      if (createDebug.names[i].test(name)) {
        return true;
      }
    }

    return false;
  }
  /**
  * Coerce `val`.
  *
  * @param {Mixed} val
  * @return {Mixed}
  * @api private
  */


  function coerce(val) {
    if (val instanceof Error) {
      return val.stack || val.message;
    }

    return val;
  }

  createDebug.enable(createDebug.load());
  return createDebug;
}

var common = setup;

var browser = createCommonjsModule(function (module, exports) {

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
/**
 * Colors.
 */

exports.colors = ['#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC', '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF', '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC', '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF', '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC', '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033', '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366', '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933', '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC', '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF', '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'];
/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */
// eslint-disable-next-line complexity

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
    return true;
  } // Internet Explorer and Edge do not support colors.


  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    return false;
  } // Is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632


  return typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
  typeof window !== 'undefined' && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
  // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
  typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
  typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
}
/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */


function formatArgs(args) {
  args[0] = (this.useColors ? '%c' : '') + this.namespace + (this.useColors ? ' %c' : ' ') + args[0] + (this.useColors ? '%c ' : ' ') + '+' + module.exports.humanize(this.diff);

  if (!this.useColors) {
    return;
  }

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit'); // The final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into

  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function (match) {
    if (match === '%%') {
      return;
    }

    index++;

    if (match === '%c') {
      // We only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });
  args.splice(lastC, 0, c);
}
/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */


function log() {
  var _console;

  // This hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return (typeof console === "undefined" ? "undefined" : _typeof(console)) === 'object' && console.log && (_console = console).log.apply(_console, arguments);
}
/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */


function save(namespaces) {
  try {
    if (namespaces) {
      exports.storage.setItem('debug', namespaces);
    } else {
      exports.storage.removeItem('debug');
    }
  } catch (error) {// Swallow
    // XXX (@Qix-) should we be logging these?
  }
}
/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */


function load() {
  var r;

  try {
    r = exports.storage.getItem('debug');
  } catch (error) {} // Swallow
  // XXX (@Qix-) should we be logging these?
  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG


  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}
/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */


function localstorage() {
  try {
    // TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
    // The Browser also has localStorage in the global context.
    return localStorage;
  } catch (error) {// Swallow
    // XXX (@Qix-) should we be logging these?
  }
}

module.exports = common(exports);
var formatters = module.exports.formatters;
/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
  try {
    return JSON.stringify(v);
  } catch (error) {
    return '[UnexpectedJSONParseError]: ' + error.message;
  }
};
});

var node = createCommonjsModule(function (module, exports) {

/**
 * Module dependencies.
 */



/**
 * This is the Node.js implementation of `debug()`.
 */


exports.init = init;
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
/**
 * Colors.
 */

exports.colors = [6, 2, 3, 4, 5, 1];

try {
  // Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
  // eslint-disable-next-line import/no-extraneous-dependencies
  var supportsColor = supportsColor_1;

  if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
    exports.colors = [20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221];
  }
} catch (error) {} // Swallow - we only care if `supports-color` is available; it doesn't have to be.

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */


exports.inspectOpts = Object.keys(process.env).filter(function (key) {
  return /^debug_/i.test(key);
}).reduce(function (obj, key) {
  // Camel-case
  var prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, function (_, k) {
    return k.toUpperCase();
  }); // Coerce string value into JS value

  var val = process.env[key];

  if (/^(yes|on|true|enabled)$/i.test(val)) {
    val = true;
  } else if (/^(no|off|false|disabled)$/i.test(val)) {
    val = false;
  } else if (val === 'null') {
    val = null;
  } else {
    val = Number(val);
  }

  obj[prop] = val;
  return obj;
}, {});
/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

function useColors() {
  return 'colors' in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
}
/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */


function formatArgs(args) {
  var name = this.namespace,
      useColors = this.useColors;

  if (useColors) {
    var c = this.color;
    var colorCode = "\x1B[3" + (c < 8 ? c : '8;5;' + c);
    var prefix = "  ".concat(colorCode, ";1m").concat(name, " \x1B[0m");
    args[0] = prefix + args[0].split('\n').join('\n' + prefix);
    args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + "\x1B[0m");
  } else {
    args[0] = getDate() + name + ' ' + args[0];
  }
}

function getDate() {
  if (exports.inspectOpts.hideDate) {
    return '';
  }

  return new Date().toISOString() + ' ';
}
/**
 * Invokes `util.format()` with the specified arguments and writes to stderr.
 */


function log() {
  return process.stderr.write(util.format.apply(util, arguments) + '\n');
}
/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */


function save(namespaces) {
  if (namespaces) {
    process.env.DEBUG = namespaces;
  } else {
    // If you set a process.env field to null or undefined, it gets cast to the
    // string 'null' or 'undefined'. Just delete instead.
    delete process.env.DEBUG;
  }
}
/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */


function load() {
  return process.env.DEBUG;
}
/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */


function init(debug) {
  debug.inspectOpts = {};
  var keys = Object.keys(exports.inspectOpts);

  for (var i = 0; i < keys.length; i++) {
    debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
  }
}

module.exports = common(exports);
var formatters = module.exports.formatters;
/**
 * Map %o to `util.inspect()`, all on a single line.
 */

formatters.o = function (v) {
  this.inspectOpts.colors = this.useColors;
  return util.inspect(v, this.inspectOpts).replace(/\s*\n\s*/g, ' ');
};
/**
 * Map %O to `util.inspect()`, allowing multiple lines if needed.
 */


formatters.O = function (v) {
  this.inspectOpts.colors = this.useColors;
  return util.inspect(v, this.inspectOpts);
};
});

var src = createCommonjsModule(function (module) {

/**
 * Detect Electron renderer / nwjs process, which is node, but we should
 * treat as a browser.
 */
if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
  module.exports = browser;
} else {
  module.exports = node;
}
});

var format = util.format;

/**
 * Factory functions to create throwable error objects
 * @module Errors
 */

/**
 * When Mocha throw exceptions (or otherwise errors), it attempts to assign a
 * `code` property to the `Error` object, for easier handling.  These are the
 * potential values of `code`.
 */
var constants = {
  /**
   * An unrecoverable error.
   */
  FATAL: 'ERR_MOCHA_FATAL',

  /**
   * The type of an argument to a function call is invalid
   */
  INVALID_ARG_TYPE: 'ERR_MOCHA_INVALID_ARG_TYPE',

  /**
   * The value of an argument to a function call is invalid
   */
  INVALID_ARG_VALUE: 'ERR_MOCHA_INVALID_ARG_VALUE',

  /**
   * Something was thrown, but it wasn't an `Error`
   */
  INVALID_EXCEPTION: 'ERR_MOCHA_INVALID_EXCEPTION',

  /**
   * An interface (e.g., `Mocha.interfaces`) is unknown or invalid
   */
  INVALID_INTERFACE: 'ERR_MOCHA_INVALID_INTERFACE',

  /**
   * A reporter (.e.g, `Mocha.reporters`) is unknown or invalid
   */
  INVALID_REPORTER: 'ERR_MOCHA_INVALID_REPORTER',

  /**
   * `done()` was called twice in a `Test` or `Hook` callback
   */
  MULTIPLE_DONE: 'ERR_MOCHA_MULTIPLE_DONE',

  /**
   * No files matched the pattern provided by the user
   */
  NO_FILES_MATCH_PATTERN: 'ERR_MOCHA_NO_FILES_MATCH_PATTERN',

  /**
   * Known, but unsupported behavior of some kind
   */
  UNSUPPORTED: 'ERR_MOCHA_UNSUPPORTED',

  /**
   * Invalid state transition occurring in `Mocha` instance
   */
  INSTANCE_ALREADY_RUNNING: 'ERR_MOCHA_INSTANCE_ALREADY_RUNNING',

  /**
   * Invalid state transition occurring in `Mocha` instance
   */
  INSTANCE_ALREADY_DISPOSED: 'ERR_MOCHA_INSTANCE_ALREADY_DISPOSED',

  /**
   * Use of `only()` w/ `--forbid-only` results in this error.
   */
  FORBIDDEN_EXCLUSIVITY: 'ERR_MOCHA_FORBIDDEN_EXCLUSIVITY'
};

/**
 * Creates an error object to be thrown when no files to be tested could be found using specified pattern.
 *
 * @public
 * @param {string} message - Error message to be displayed.
 * @param {string} pattern - User-specified argument value.
 * @returns {Error} instance detailing the error condition
 */
function createNoFilesMatchPatternError(message, pattern) {
  var err = new Error(message);
  err.code = constants.NO_FILES_MATCH_PATTERN;
  err.pattern = pattern;
  return err;
}

/**
 * Creates an error object to be thrown when the reporter specified in the options was not found.
 *
 * @public
 * @param {string} message - Error message to be displayed.
 * @param {string} reporter - User-specified reporter value.
 * @returns {Error} instance detailing the error condition
 */
function createInvalidReporterError(message, reporter) {
  var err = new TypeError(message);
  err.code = constants.INVALID_REPORTER;
  err.reporter = reporter;
  return err;
}

/**
 * Creates an error object to be thrown when the interface specified in the options was not found.
 *
 * @public
 * @param {string} message - Error message to be displayed.
 * @param {string} ui - User-specified interface value.
 * @returns {Error} instance detailing the error condition
 */
function createInvalidInterfaceError(message, ui) {
  var err = new Error(message);
  err.code = constants.INVALID_INTERFACE;
  err.interface = ui;
  return err;
}

/**
 * Creates an error object to be thrown when a behavior, option, or parameter is unsupported.
 *
 * @public
 * @param {string} message - Error message to be displayed.
 * @returns {Error} instance detailing the error condition
 */
function createUnsupportedError(message) {
  var err = new Error(message);
  err.code = constants.UNSUPPORTED;
  return err;
}

/**
 * Creates an error object to be thrown when an argument is missing.
 *
 * @public
 * @param {string} message - Error message to be displayed.
 * @param {string} argument - Argument name.
 * @param {string} expected - Expected argument datatype.
 * @returns {Error} instance detailing the error condition
 */
function createMissingArgumentError(message, argument, expected) {
  return createInvalidArgumentTypeError(message, argument, expected);
}

/**
 * Creates an error object to be thrown when an argument did not use the supported type
 *
 * @public
 * @param {string} message - Error message to be displayed.
 * @param {string} argument - Argument name.
 * @param {string} expected - Expected argument datatype.
 * @returns {Error} instance detailing the error condition
 */
function createInvalidArgumentTypeError(message, argument, expected) {
  var err = new TypeError(message);
  err.code = constants.INVALID_ARG_TYPE;
  err.argument = argument;
  err.expected = expected;
  err.actual = typeof argument;
  return err;
}

/**
 * Creates an error object to be thrown when an argument did not use the supported value
 *
 * @public
 * @param {string} message - Error message to be displayed.
 * @param {string} argument - Argument name.
 * @param {string} value - Argument value.
 * @param {string} [reason] - Why value is invalid.
 * @returns {Error} instance detailing the error condition
 */
function createInvalidArgumentValueError(message, argument, value, reason) {
  var err = new TypeError(message);
  err.code = constants.INVALID_ARG_VALUE;
  err.argument = argument;
  err.value = value;
  err.reason = typeof reason !== 'undefined' ? reason : 'is invalid';
  return err;
}

/**
 * Creates an error object to be thrown when an exception was caught, but the `Error` is falsy or undefined.
 *
 * @public
 * @param {string} message - Error message to be displayed.
 * @returns {Error} instance detailing the error condition
 */
function createInvalidExceptionError(message, value) {
  var err = new Error(message);
  err.code = constants.INVALID_EXCEPTION;
  err.valueType = typeof value;
  err.value = value;
  return err;
}

/**
 * Creates an error object to be thrown when an unrecoverable error occurs.
 *
 * @public
 * @param {string} message - Error message to be displayed.
 * @returns {Error} instance detailing the error condition
 */
function createFatalError(message, value) {
  var err = new Error(message);
  err.code = constants.FATAL;
  err.valueType = typeof value;
  err.value = value;
  return err;
}

/**
 * Dynamically creates a plugin-type-specific error based on plugin type
 * @param {string} message - Error message
 * @param {"reporter"|"interface"} pluginType - Plugin type. Future: expand as needed
 * @param {string} [pluginId] - Name/path of plugin, if any
 * @throws When `pluginType` is not known
 * @public
 * @returns {Error}
 */
function createInvalidPluginError(message, pluginType, pluginId) {
  switch (pluginType) {
    case 'reporter':
      return createInvalidReporterError(message, pluginId);
    case 'interface':
      return createInvalidInterfaceError(message, pluginId);
    default:
      throw new Error('unknown pluginType "' + pluginType + '"');
  }
}

/**
 * Creates an error object to be thrown when a mocha object's `run` method is executed while it is already disposed.
 * @param {string} message The error message to be displayed.
 * @param {boolean} cleanReferencesAfterRun the value of `cleanReferencesAfterRun`
 * @param {Mocha} instance the mocha instance that throw this error
 */
function createMochaInstanceAlreadyDisposedError(
  message,
  cleanReferencesAfterRun,
  instance
) {
  var err = new Error(message);
  err.code = constants.INSTANCE_ALREADY_DISPOSED;
  err.cleanReferencesAfterRun = cleanReferencesAfterRun;
  err.instance = instance;
  return err;
}

/**
 * Creates an error object to be thrown when a mocha object's `run` method is called while a test run is in progress.
 * @param {string} message The error message to be displayed.
 */
function createMochaInstanceAlreadyRunningError(message, instance) {
  var err = new Error(message);
  err.code = constants.INSTANCE_ALREADY_RUNNING;
  err.instance = instance;
  return err;
}

/*
 * Creates an error object to be thrown when done() is called multiple times in a test
 *
 * @public
 * @param {Runnable} runnable - Original runnable
 * @param {Error} [originalErr] - Original error, if any
 * @returns {Error} instance detailing the error condition
 */
function createMultipleDoneError(runnable, originalErr) {
  var title;
  try {
    title = format('<%s>', runnable.fullTitle());
    if (runnable.parent.root) {
      title += ' (of root suite)';
    }
  } catch (ignored) {
    title = format('<%s> (of unknown suite)', runnable.title);
  }
  var message = format(
    'done() called multiple times in %s %s',
    runnable.type ? runnable.type : 'unknown runnable',
    title
  );
  if (runnable.file) {
    message += format(' of file %s', runnable.file);
  }
  if (originalErr) {
    message += format('; in addition, done() received error: %s', originalErr);
  }

  var err = new Error(message);
  err.code = constants.MULTIPLE_DONE;
  err.valueType = typeof originalErr;
  err.value = originalErr;
  return err;
}

/**
 * Creates an error object to be thrown when `.only()` is used with
 * `--forbid-only`.
 * @public
 * @param {Mocha} mocha - Mocha instance
 * @returns {Error} Error with code {@link constants.FORBIDDEN_EXCLUSIVITY}
 */
function createForbiddenExclusivityError(mocha) {
  var err = new Error(
    mocha.isWorker
      ? '`.only` is not supported in parallel mode'
      : '`.only` forbidden by --forbid-only'
  );
  err.code = constants.FORBIDDEN_EXCLUSIVITY;
  return err;
}

var errors = {
  createInvalidArgumentTypeError: createInvalidArgumentTypeError,
  createInvalidArgumentValueError: createInvalidArgumentValueError,
  createInvalidExceptionError: createInvalidExceptionError,
  createInvalidInterfaceError: createInvalidInterfaceError,
  createInvalidReporterError: createInvalidReporterError,
  createMissingArgumentError: createMissingArgumentError,
  createNoFilesMatchPatternError: createNoFilesMatchPatternError,
  createUnsupportedError: createUnsupportedError,
  createInvalidPluginError: createInvalidPluginError,
  createMochaInstanceAlreadyDisposedError: createMochaInstanceAlreadyDisposedError,
  createMochaInstanceAlreadyRunningError: createMochaInstanceAlreadyRunningError,
  createFatalError: createFatalError,
  createMultipleDoneError: createMultipleDoneError,
  createForbiddenExclusivityError: createForbiddenExclusivityError,
  constants: constants
};

var EventEmitter = events.EventEmitter;

var debug = src('mocha:runnable');



var createInvalidExceptionError$1 = errors.createInvalidExceptionError;
var createMultipleDoneError$1 = errors.createMultipleDoneError;

/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 * @private
 */
var Date$1 = commonjsGlobal.Date;
var setTimeout$1 = commonjsGlobal.setTimeout;
var clearTimeout$1 = commonjsGlobal.clearTimeout;
var toString = Object.prototype.toString;

var runnable = Runnable;

/**
 * Initialize a new `Runnable` with the given `title` and callback `fn`.
 *
 * @class
 * @extends external:EventEmitter
 * @public
 * @param {String} title
 * @param {Function} fn
 */
function Runnable(title, fn) {
  this.title = title;
  this.fn = fn;
  this.body = (fn || '').toString();
  this.async = fn && fn.length;
  this.sync = !this.async;
  this._timeout = 2000;
  this._slow = 75;
  this._retries = -1;
  this.reset();
}

/**
 * Inherit from `EventEmitter.prototype`.
 */
utils.inherits(Runnable, EventEmitter);

/**
 * Resets the state initially or for a next run.
 */
Runnable.prototype.reset = function() {
  this.timedOut = false;
  this._currentRetry = 0;
  this.pending = false;
  delete this.state;
  delete this.err;
};

/**
 * Get current timeout value in msecs.
 *
 * @private
 * @returns {number} current timeout threshold value
 */
/**
 * @summary
 * Set timeout threshold value (msecs).
 *
 * @description
 * A string argument can use shorthand (e.g., "2s") and will be converted.
 * The value will be clamped to range [<code>0</code>, <code>2^<sup>31</sup>-1</code>].
 * If clamped value matches either range endpoint, timeouts will be disabled.
 *
 * @private
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Maximum_delay_value}
 * @param {number|string} ms - Timeout threshold value.
 * @returns {Runnable} this
 * @chainable
 */
Runnable.prototype.timeout = function(ms$1) {
  if (!arguments.length) {
    return this._timeout;
  }
  if (typeof ms$1 === 'string') {
    ms$1 = ms(ms$1);
  }

  // Clamp to range
  var INT_MAX = Math.pow(2, 31) - 1;
  var range = [0, INT_MAX];
  ms$1 = utils.clamp(ms$1, range);

  // see #1652 for reasoning
  if (ms$1 === range[0] || ms$1 === range[1]) {
    this._timeout = 0;
  } else {
    this._timeout = ms$1;
  }
  debug('timeout %d', this._timeout);

  if (this.timer) {
    this.resetTimeout();
  }
  return this;
};

/**
 * Set or get slow `ms`.
 *
 * @private
 * @param {number|string} ms
 * @return {Runnable|number} ms or Runnable instance.
 */
Runnable.prototype.slow = function(ms$1) {
  if (!arguments.length || typeof ms$1 === 'undefined') {
    return this._slow;
  }
  if (typeof ms$1 === 'string') {
    ms$1 = ms(ms$1);
  }
  debug('slow %d', ms$1);
  this._slow = ms$1;
  return this;
};

/**
 * Halt and mark as pending.
 *
 * @memberof Mocha.Runnable
 * @public
 */
Runnable.prototype.skip = function() {
  this.pending = true;
  throw new pending('sync skip; aborting execution');
};

/**
 * Check if this runnable or its parent suite is marked as pending.
 *
 * @private
 */
Runnable.prototype.isPending = function() {
  return this.pending || (this.parent && this.parent.isPending());
};

/**
 * Return `true` if this Runnable has failed.
 * @return {boolean}
 * @private
 */
Runnable.prototype.isFailed = function() {
  return !this.isPending() && this.state === constants$1.STATE_FAILED;
};

/**
 * Return `true` if this Runnable has passed.
 * @return {boolean}
 * @private
 */
Runnable.prototype.isPassed = function() {
  return !this.isPending() && this.state === constants$1.STATE_PASSED;
};

/**
 * Set or get number of retries.
 *
 * @private
 */
Runnable.prototype.retries = function(n) {
  if (!arguments.length) {
    return this._retries;
  }
  this._retries = n;
};

/**
 * Set or get current retry
 *
 * @private
 */
Runnable.prototype.currentRetry = function(n) {
  if (!arguments.length) {
    return this._currentRetry;
  }
  this._currentRetry = n;
};

/**
 * Return the full title generated by recursively concatenating the parent's
 * full title.
 *
 * @memberof Mocha.Runnable
 * @public
 * @return {string}
 */
Runnable.prototype.fullTitle = function() {
  return this.titlePath().join(' ');
};

/**
 * Return the title path generated by concatenating the parent's title path with the title.
 *
 * @memberof Mocha.Runnable
 * @public
 * @return {string}
 */
Runnable.prototype.titlePath = function() {
  return this.parent.titlePath().concat([this.title]);
};

/**
 * Clear the timeout.
 *
 * @private
 */
Runnable.prototype.clearTimeout = function() {
  clearTimeout$1(this.timer);
};

/**
 * Reset the timeout.
 *
 * @private
 */
Runnable.prototype.resetTimeout = function() {
  var self = this;
  var ms = this.timeout();

  if (ms === 0) {
    return;
  }
  this.clearTimeout();
  this.timer = setTimeout$1(function() {
    if (self.timeout() === 0) {
      return;
    }
    self.callback(self._timeoutError(ms));
    self.timedOut = true;
  }, ms);
};

/**
 * Set or get a list of whitelisted globals for this test run.
 *
 * @private
 * @param {string[]} globals
 */
Runnable.prototype.globals = function(globals) {
  if (!arguments.length) {
    return this._allowedGlobals;
  }
  this._allowedGlobals = globals;
};

/**
 * Run the test and invoke `fn(err)`.
 *
 * @param {Function} fn
 * @private
 */
Runnable.prototype.run = function(fn) {
  var self = this;
  var start = new Date$1();
  var ctx = this.ctx;
  var finished;
  var errorWasHandled = false;

  if (this.isPending()) return fn();

  // Sometimes the ctx exists, but it is not runnable
  if (ctx && ctx.runnable) {
    ctx.runnable(this);
  }

  // called multiple times
  function multiple(err) {
    if (errorWasHandled) {
      return;
    }
    errorWasHandled = true;
    self.emit('error', createMultipleDoneError$1(self, err));
  }

  // finished
  function done(err) {
    var ms = self.timeout();
    if (self.timedOut) {
      return;
    }

    if (finished) {
      return multiple(err);
    }

    self.clearTimeout();
    self.duration = new Date$1() - start;
    finished = true;
    if (!err && self.duration > ms && ms > 0) {
      err = self._timeoutError(ms);
    }
    fn(err);
  }

  // for .resetTimeout() and Runner#uncaught()
  this.callback = done;

  if (this.fn && typeof this.fn.call !== 'function') {
    done(
      new TypeError(
        'A runnable must be passed a function as its second argument.'
      )
    );
    return;
  }

  // explicit async with `done` argument
  if (this.async) {
    this.resetTimeout();

    // allows skip() to be used in an explicit async context
    this.skip = function asyncSkip() {
      this.pending = true;
      done();
      // halt execution, the uncaught handler will ignore the failure.
      throw new pending('async skip; aborting execution');
    };

    try {
      callFnAsync(this.fn);
    } catch (err) {
      // handles async runnables which actually run synchronously
      errorWasHandled = true;
      if (err instanceof pending) {
        return; // done() is already called in this.skip()
      } else if (this.allowUncaught) {
        throw err;
      }
      done(Runnable.toValueOrError(err));
    }
    return;
  }

  // sync or promise-returning
  try {
    callFn(this.fn);
  } catch (err) {
    errorWasHandled = true;
    if (err instanceof pending) {
      return done();
    } else if (this.allowUncaught) {
      throw err;
    }
    done(Runnable.toValueOrError(err));
  }

  function callFn(fn) {
    var result = fn.call(ctx);
    if (result && typeof result.then === 'function') {
      self.resetTimeout();
      result.then(
        function() {
          done();
          // Return null so libraries like bluebird do not warn about
          // subsequently constructed Promises.
          return null;
        },
        function(reason) {
          done(reason || new Error('Promise rejected with no or falsy reason'));
        }
      );
    } else {
      if (self.asyncOnly) {
        return done(
          new Error(
            '--async-only option in use without declaring `done()` or returning a promise'
          )
        );
      }

      done();
    }
  }

  function callFnAsync(fn) {
    var result = fn.call(ctx, function(err) {
      if (err instanceof Error || toString.call(err) === '[object Error]') {
        return done(err);
      }
      if (err) {
        if (Object.prototype.toString.call(err) === '[object Object]') {
          return done(
            new Error('done() invoked with non-Error: ' + JSON.stringify(err))
          );
        }
        return done(new Error('done() invoked with non-Error: ' + err));
      }
      if (result && utils.isPromise(result)) {
        return done(
          new Error(
            'Resolution method is overspecified. Specify a callback *or* return a Promise; not both.'
          )
        );
      }

      done();
    });
  }
};

/**
 * Instantiates a "timeout" error
 *
 * @param {number} ms - Timeout (in milliseconds)
 * @returns {Error} a "timeout" error
 * @private
 */
Runnable.prototype._timeoutError = function(ms) {
  var msg =
    'Timeout of ' +
    ms +
    'ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves.';
  if (this.file) {
    msg += ' (' + this.file + ')';
  }
  return new Error(msg);
};

var constants$1 = utils.defineConstants(
  /**
   * {@link Runnable}-related constants.
   * @public
   * @memberof Runnable
   * @readonly
   * @static
   * @alias constants
   * @enum {string}
   */
  {
    /**
     * Value of `state` prop when a `Runnable` has failed
     */
    STATE_FAILED: 'failed',
    /**
     * Value of `state` prop when a `Runnable` has passed
     */
    STATE_PASSED: 'passed',
    /**
     * Value of `state` prop when a `Runnable` has been skipped by user
     */
    STATE_PENDING: 'pending'
  }
);

/**
 * Given `value`, return identity if truthy, otherwise create an "invalid exception" error and return that.
 * @param {*} [value] - Value to return, if present
 * @returns {*|Error} `value`, otherwise an `Error`
 * @private
 */
Runnable.toValueOrError = function(value) {
  return (
    value ||
    createInvalidExceptionError$1(
      'Runnable failed with falsy or undefined exception. Please throw an Error instead.',
      value
    )
  );
};

Runnable.constants = constants$1;

var inherits = utils.inherits;

/**
 * Expose `Hook`.
 */

var hook = Hook;

/**
 * Initialize a new `Hook` with the given `title` and callback `fn`
 *
 * @class
 * @extends Runnable
 * @param {String} title
 * @param {Function} fn
 */
function Hook(title, fn) {
  runnable.call(this, title, fn);
  this.type = 'hook';
}

/**
 * Inherit from `Runnable.prototype`.
 */
inherits(Hook, runnable);

/**
 * Resets the state for a next run.
 */
Hook.prototype.reset = function() {
  runnable.prototype.reset.call(this);
  delete this._error;
};

/**
 * Get or set the test `err`.
 *
 * @memberof Hook
 * @public
 * @param {Error} err
 * @return {Error}
 */
Hook.prototype.error = function(err) {
  if (!arguments.length) {
    err = this._error;
    this._error = null;
    return err;
  }

  this._error = err;
};

/**
 * Returns an object suitable for IPC.
 * Functions are represented by keys beginning with `$$`.
 * @private
 * @returns {Object}
 */
Hook.prototype.serialize = function serialize() {
  return {
    $$isPending: this.isPending(),
    $$titlePath: this.titlePath(),
    ctx: {
      currentTest: {
        title: this.ctx && this.ctx.currentTest && this.ctx.currentTest.title
      }
    },
    parent: {
      root: this.parent.root,
      title: this.parent.title
    },
    title: this.title,
    type: this.type
  };
};

var suite = createCommonjsModule(function (module, exports) {

/**
 * Module dependencies.
 * @private
 */
var EventEmitter = events.EventEmitter;


var inherits = utils.inherits;
var debug = src('mocha:suite');


var createInvalidArgumentTypeError = errors.createInvalidArgumentTypeError;

/**
 * Expose `Suite`.
 */

exports = module.exports = Suite;

/**
 * Create a new `Suite` with the given `title` and parent `Suite`.
 *
 * @public
 * @param {Suite} parent - Parent suite (required!)
 * @param {string} title - Title
 * @return {Suite}
 */
Suite.create = function(parent, title) {
  var suite = new Suite(title, parent.ctx);
  suite.parent = parent;
  title = suite.fullTitle();
  parent.addSuite(suite);
  return suite;
};

/**
 * Constructs a new `Suite` instance with the given `title`, `ctx`, and `isRoot`.
 *
 * @public
 * @class
 * @extends EventEmitter
 * @see {@link https://nodejs.org/api/events.html#events_class_eventemitter|EventEmitter}
 * @param {string} title - Suite title.
 * @param {Context} parentContext - Parent context instance.
 * @param {boolean} [isRoot=false] - Whether this is the root suite.
 */
function Suite(title, parentContext, isRoot) {
  if (!utils.isString(title)) {
    throw createInvalidArgumentTypeError(
      'Suite argument "title" must be a string. Received type "' +
        typeof title +
        '"',
      'title',
      'string'
    );
  }
  this.title = title;
  function Context() {}
  Context.prototype = parentContext;
  this.ctx = new Context();
  this.suites = [];
  this.tests = [];
  this.root = isRoot === true;
  this.pending = false;
  this._retries = -1;
  this._beforeEach = [];
  this._beforeAll = [];
  this._afterEach = [];
  this._afterAll = [];
  this._timeout = 2000;
  this._slow = 75;
  this._bail = false;
  this._onlyTests = [];
  this._onlySuites = [];
  this.reset();

  this.on('newListener', function(event) {
    if (deprecatedEvents[event]) {
      utils.deprecate(
        'Event "' +
          event +
          '" is deprecated.  Please let the Mocha team know about your use case: https://git.io/v6Lwm'
      );
    }
  });
}

/**
 * Inherit from `EventEmitter.prototype`.
 */
inherits(Suite, EventEmitter);

/**
 * Resets the state initially or for a next run.
 */
Suite.prototype.reset = function() {
  this.delayed = false;
  function doReset(thingToReset) {
    thingToReset.reset();
  }
  this.suites.forEach(doReset);
  this.tests.forEach(doReset);
  this._beforeEach.forEach(doReset);
  this._afterEach.forEach(doReset);
  this._beforeAll.forEach(doReset);
  this._afterAll.forEach(doReset);
};

/**
 * Return a clone of this `Suite`.
 *
 * @private
 * @return {Suite}
 */
Suite.prototype.clone = function() {
  var suite = new Suite(this.title);
  debug('clone');
  suite.ctx = this.ctx;
  suite.root = this.root;
  suite.timeout(this.timeout());
  suite.retries(this.retries());
  suite.slow(this.slow());
  suite.bail(this.bail());
  return suite;
};

/**
 * Set or get timeout `ms` or short-hand such as "2s".
 *
 * @private
 * @todo Do not attempt to set value if `ms` is undefined
 * @param {number|string} ms
 * @return {Suite|number} for chaining
 */
Suite.prototype.timeout = function(ms$1) {
  if (!arguments.length) {
    return this._timeout;
  }
  if (typeof ms$1 === 'string') {
    ms$1 = ms(ms$1);
  }

  // Clamp to range
  var INT_MAX = Math.pow(2, 31) - 1;
  var range = [0, INT_MAX];
  ms$1 = utils.clamp(ms$1, range);

  debug('timeout %d', ms$1);
  this._timeout = parseInt(ms$1, 10);
  return this;
};

/**
 * Set or get number of times to retry a failed test.
 *
 * @private
 * @param {number|string} n
 * @return {Suite|number} for chaining
 */
Suite.prototype.retries = function(n) {
  if (!arguments.length) {
    return this._retries;
  }
  debug('retries %d', n);
  this._retries = parseInt(n, 10) || 0;
  return this;
};

/**
 * Set or get slow `ms` or short-hand such as "2s".
 *
 * @private
 * @param {number|string} ms
 * @return {Suite|number} for chaining
 */
Suite.prototype.slow = function(ms$1) {
  if (!arguments.length) {
    return this._slow;
  }
  if (typeof ms$1 === 'string') {
    ms$1 = ms(ms$1);
  }
  debug('slow %d', ms$1);
  this._slow = ms$1;
  return this;
};

/**
 * Set or get whether to bail after first error.
 *
 * @private
 * @param {boolean} bail
 * @return {Suite|number} for chaining
 */
Suite.prototype.bail = function(bail) {
  if (!arguments.length) {
    return this._bail;
  }
  debug('bail %s', bail);
  this._bail = bail;
  return this;
};

/**
 * Check if this suite or its parent suite is marked as pending.
 *
 * @private
 */
Suite.prototype.isPending = function() {
  return this.pending || (this.parent && this.parent.isPending());
};

/**
 * Generic hook-creator.
 * @private
 * @param {string} title - Title of hook
 * @param {Function} fn - Hook callback
 * @returns {Hook} A new hook
 */
Suite.prototype._createHook = function(title, fn) {
  var hook$1 = new hook(title, fn);
  hook$1.parent = this;
  hook$1.timeout(this.timeout());
  hook$1.retries(this.retries());
  hook$1.slow(this.slow());
  hook$1.ctx = this.ctx;
  hook$1.file = this.file;
  return hook$1;
};

/**
 * Run `fn(test[, done])` before running tests.
 *
 * @private
 * @param {string} title
 * @param {Function} fn
 * @return {Suite} for chaining
 */
Suite.prototype.beforeAll = function(title, fn) {
  if (this.isPending()) {
    return this;
  }
  if (typeof title === 'function') {
    fn = title;
    title = fn.name;
  }
  title = '"before all" hook' + (title ? ': ' + title : '');

  var hook = this._createHook(title, fn);
  this._beforeAll.push(hook);
  this.emit(constants.EVENT_SUITE_ADD_HOOK_BEFORE_ALL, hook);
  return this;
};

/**
 * Run `fn(test[, done])` after running tests.
 *
 * @private
 * @param {string} title
 * @param {Function} fn
 * @return {Suite} for chaining
 */
Suite.prototype.afterAll = function(title, fn) {
  if (this.isPending()) {
    return this;
  }
  if (typeof title === 'function') {
    fn = title;
    title = fn.name;
  }
  title = '"after all" hook' + (title ? ': ' + title : '');

  var hook = this._createHook(title, fn);
  this._afterAll.push(hook);
  this.emit(constants.EVENT_SUITE_ADD_HOOK_AFTER_ALL, hook);
  return this;
};

/**
 * Run `fn(test[, done])` before each test case.
 *
 * @private
 * @param {string} title
 * @param {Function} fn
 * @return {Suite} for chaining
 */
Suite.prototype.beforeEach = function(title, fn) {
  if (this.isPending()) {
    return this;
  }
  if (typeof title === 'function') {
    fn = title;
    title = fn.name;
  }
  title = '"before each" hook' + (title ? ': ' + title : '');

  var hook = this._createHook(title, fn);
  this._beforeEach.push(hook);
  this.emit(constants.EVENT_SUITE_ADD_HOOK_BEFORE_EACH, hook);
  return this;
};

/**
 * Run `fn(test[, done])` after each test case.
 *
 * @private
 * @param {string} title
 * @param {Function} fn
 * @return {Suite} for chaining
 */
Suite.prototype.afterEach = function(title, fn) {
  if (this.isPending()) {
    return this;
  }
  if (typeof title === 'function') {
    fn = title;
    title = fn.name;
  }
  title = '"after each" hook' + (title ? ': ' + title : '');

  var hook = this._createHook(title, fn);
  this._afterEach.push(hook);
  this.emit(constants.EVENT_SUITE_ADD_HOOK_AFTER_EACH, hook);
  return this;
};

/**
 * Add a test `suite`.
 *
 * @private
 * @param {Suite} suite
 * @return {Suite} for chaining
 */
Suite.prototype.addSuite = function(suite) {
  suite.parent = this;
  suite.root = false;
  suite.timeout(this.timeout());
  suite.retries(this.retries());
  suite.slow(this.slow());
  suite.bail(this.bail());
  this.suites.push(suite);
  this.emit(constants.EVENT_SUITE_ADD_SUITE, suite);
  return this;
};

/**
 * Add a `test` to this suite.
 *
 * @private
 * @param {Test} test
 * @return {Suite} for chaining
 */
Suite.prototype.addTest = function(test) {
  test.parent = this;
  test.timeout(this.timeout());
  test.retries(this.retries());
  test.slow(this.slow());
  test.ctx = this.ctx;
  this.tests.push(test);
  this.emit(constants.EVENT_SUITE_ADD_TEST, test);
  return this;
};

/**
 * Return the full title generated by recursively concatenating the parent's
 * full title.
 *
 * @memberof Suite
 * @public
 * @return {string}
 */
Suite.prototype.fullTitle = function() {
  return this.titlePath().join(' ');
};

/**
 * Return the title path generated by recursively concatenating the parent's
 * title path.
 *
 * @memberof Suite
 * @public
 * @return {string}
 */
Suite.prototype.titlePath = function() {
  var result = [];
  if (this.parent) {
    result = result.concat(this.parent.titlePath());
  }
  if (!this.root) {
    result.push(this.title);
  }
  return result;
};

/**
 * Return the total number of tests.
 *
 * @memberof Suite
 * @public
 * @return {number}
 */
Suite.prototype.total = function() {
  return (
    this.suites.reduce(function(sum, suite) {
      return sum + suite.total();
    }, 0) + this.tests.length
  );
};

/**
 * Iterates through each suite recursively to find all tests. Applies a
 * function in the format `fn(test)`.
 *
 * @private
 * @param {Function} fn
 * @return {Suite}
 */
Suite.prototype.eachTest = function(fn) {
  this.tests.forEach(fn);
  this.suites.forEach(function(suite) {
    suite.eachTest(fn);
  });
  return this;
};

/**
 * This will run the root suite if we happen to be running in delayed mode.
 * @private
 */
Suite.prototype.run = function run() {
  if (this.root) {
    this.emit(constants.EVENT_ROOT_SUITE_RUN);
  }
};

/**
 * Determines whether a suite has an `only` test or suite as a descendant.
 *
 * @private
 * @returns {Boolean}
 */
Suite.prototype.hasOnly = function hasOnly() {
  return (
    this._onlyTests.length > 0 ||
    this._onlySuites.length > 0 ||
    this.suites.some(function(suite) {
      return suite.hasOnly();
    })
  );
};

/**
 * Filter suites based on `isOnly` logic.
 *
 * @private
 * @returns {Boolean}
 */
Suite.prototype.filterOnly = function filterOnly() {
  if (this._onlyTests.length) {
    // If the suite contains `only` tests, run those and ignore any nested suites.
    this.tests = this._onlyTests;
    this.suites = [];
  } else {
    // Otherwise, do not run any of the tests in this suite.
    this.tests = [];
    this._onlySuites.forEach(function(onlySuite) {
      // If there are other `only` tests/suites nested in the current `only` suite, then filter that `only` suite.
      // Otherwise, all of the tests on this `only` suite should be run, so don't filter it.
      if (onlySuite.hasOnly()) {
        onlySuite.filterOnly();
      }
    });
    // Run the `only` suites, as well as any other suites that have `only` tests/suites as descendants.
    var onlySuites = this._onlySuites;
    this.suites = this.suites.filter(function(childSuite) {
      return onlySuites.indexOf(childSuite) !== -1 || childSuite.filterOnly();
    });
  }
  // Keep the suite only if there is something to run
  return this.tests.length > 0 || this.suites.length > 0;
};

/**
 * Adds a suite to the list of subsuites marked `only`.
 *
 * @private
 * @param {Suite} suite
 */
Suite.prototype.appendOnlySuite = function(suite) {
  this._onlySuites.push(suite);
};

/**
 * Marks a suite to be `only`.
 *
 * @private
 */
Suite.prototype.markOnly = function() {
  this.parent && this.parent.appendOnlySuite(this);
};

/**
 * Adds a test to the list of tests marked `only`.
 *
 * @private
 * @param {Test} test
 */
Suite.prototype.appendOnlyTest = function(test) {
  this._onlyTests.push(test);
};

/**
 * Returns the array of hooks by hook name; see `HOOK_TYPE_*` constants.
 * @private
 */
Suite.prototype.getHooks = function getHooks(name) {
  return this['_' + name];
};

/**
 * cleans all references from this suite and all child suites.
 */
Suite.prototype.dispose = function() {
  this.suites.forEach(function(suite) {
    suite.dispose();
  });
  this.cleanReferences();
};

/**
 * Cleans up the references to all the deferred functions
 * (before/after/beforeEach/afterEach) and tests of a Suite.
 * These must be deleted otherwise a memory leak can happen,
 * as those functions may reference variables from closures,
 * thus those variables can never be garbage collected as long
 * as the deferred functions exist.
 *
 * @private
 */
Suite.prototype.cleanReferences = function cleanReferences() {
  function cleanArrReferences(arr) {
    for (var i = 0; i < arr.length; i++) {
      delete arr[i].fn;
    }
  }

  if (Array.isArray(this._beforeAll)) {
    cleanArrReferences(this._beforeAll);
  }

  if (Array.isArray(this._beforeEach)) {
    cleanArrReferences(this._beforeEach);
  }

  if (Array.isArray(this._afterAll)) {
    cleanArrReferences(this._afterAll);
  }

  if (Array.isArray(this._afterEach)) {
    cleanArrReferences(this._afterEach);
  }

  for (var i = 0; i < this.tests.length; i++) {
    delete this.tests[i].fn;
  }
};

/**
 * Returns an object suitable for IPC.
 * Functions are represented by keys beginning with `$$`.
 * @private
 * @returns {Object}
 */
Suite.prototype.serialize = function serialize() {
  return {
    _bail: this._bail,
    $$fullTitle: this.fullTitle(),
    $$isPending: this.isPending(),
    root: this.root,
    title: this.title
  };
};

var constants = utils.defineConstants(
  /**
   * {@link Suite}-related constants.
   * @public
   * @memberof Suite
   * @alias constants
   * @readonly
   * @static
   * @enum {string}
   */
  {
    /**
     * Event emitted after a test file has been loaded Not emitted in browser.
     */
    EVENT_FILE_POST_REQUIRE: 'post-require',
    /**
     * Event emitted before a test file has been loaded. In browser, this is emitted once an interface has been selected.
     */
    EVENT_FILE_PRE_REQUIRE: 'pre-require',
    /**
     * Event emitted immediately after a test file has been loaded. Not emitted in browser.
     */
    EVENT_FILE_REQUIRE: 'require',
    /**
     * Event emitted when `global.run()` is called (use with `delay` option)
     */
    EVENT_ROOT_SUITE_RUN: 'run',

    /**
     * Namespace for collection of a `Suite`'s "after all" hooks
     */
    HOOK_TYPE_AFTER_ALL: 'afterAll',
    /**
     * Namespace for collection of a `Suite`'s "after each" hooks
     */
    HOOK_TYPE_AFTER_EACH: 'afterEach',
    /**
     * Namespace for collection of a `Suite`'s "before all" hooks
     */
    HOOK_TYPE_BEFORE_ALL: 'beforeAll',
    /**
     * Namespace for collection of a `Suite`'s "before all" hooks
     */
    HOOK_TYPE_BEFORE_EACH: 'beforeEach',

    // the following events are all deprecated

    /**
     * Emitted after an "after all" `Hook` has been added to a `Suite`. Deprecated
     */
    EVENT_SUITE_ADD_HOOK_AFTER_ALL: 'afterAll',
    /**
     * Emitted after an "after each" `Hook` has been added to a `Suite` Deprecated
     */
    EVENT_SUITE_ADD_HOOK_AFTER_EACH: 'afterEach',
    /**
     * Emitted after an "before all" `Hook` has been added to a `Suite` Deprecated
     */
    EVENT_SUITE_ADD_HOOK_BEFORE_ALL: 'beforeAll',
    /**
     * Emitted after an "before each" `Hook` has been added to a `Suite` Deprecated
     */
    EVENT_SUITE_ADD_HOOK_BEFORE_EACH: 'beforeEach',
    /**
     * Emitted after a child `Suite` has been added to a `Suite`. Deprecated
     */
    EVENT_SUITE_ADD_SUITE: 'suite',
    /**
     * Emitted after a `Test` has been added to a `Suite`. Deprecated
     */
    EVENT_SUITE_ADD_TEST: 'test'
  }
);

/**
 * @summary There are no known use cases for these events.
 * @desc This is a `Set`-like object having all keys being the constant's string value and the value being `true`.
 * @todo Remove eventually
 * @type {Object<string,boolean>}
 * @ignore
 */
var deprecatedEvents = Object.keys(constants)
  .filter(function(constant) {
    return constant.substring(0, 15) === 'EVENT_SUITE_ADD';
  })
  .reduce(function(acc, constant) {
    acc[constants[constant]] = true;
    return acc;
  }, utils.createMap());

Suite.constants = constants;
});

/**
 * Module dependencies.
 * @private
 */

var EventEmitter$1 = events.EventEmitter;


var inherits$1 = utils.inherits;
var debug$1 = src('mocha:runner');


var HOOK_TYPE_BEFORE_EACH = suite.constants.HOOK_TYPE_BEFORE_EACH;
var HOOK_TYPE_AFTER_EACH = suite.constants.HOOK_TYPE_AFTER_EACH;
var HOOK_TYPE_AFTER_ALL = suite.constants.HOOK_TYPE_AFTER_ALL;
var HOOK_TYPE_BEFORE_ALL = suite.constants.HOOK_TYPE_BEFORE_ALL;
var EVENT_ROOT_SUITE_RUN = suite.constants.EVENT_ROOT_SUITE_RUN;
var STATE_FAILED = runnable.constants.STATE_FAILED;
var STATE_PASSED = runnable.constants.STATE_PASSED;
var STATE_PENDING = runnable.constants.STATE_PENDING;
var dQuote = utils.dQuote;
var sQuote = utils.sQuote;
var stackFilter = utils.stackTraceFilter();
var stringify = utils.stringify;
var type = utils.type;

var createInvalidExceptionError$2 = errors.createInvalidExceptionError;
var createUnsupportedError$1 = errors.createUnsupportedError;
var createFatalError$1 = errors.createFatalError;

/**
 * Non-enumerable globals.
 * @private
 * @readonly
 */
var globals = [
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'XMLHttpRequest',
  'Date',
  'setImmediate',
  'clearImmediate'
];

var constants$2 = utils.defineConstants(
  /**
   * {@link Runner}-related constants.
   * @public
   * @memberof Runner
   * @readonly
   * @alias constants
   * @static
   * @enum {string}
   */
  {
    /**
     * Emitted when {@link Hook} execution begins
     */
    EVENT_HOOK_BEGIN: 'hook',
    /**
     * Emitted when {@link Hook} execution ends
     */
    EVENT_HOOK_END: 'hook end',
    /**
     * Emitted when Root {@link Suite} execution begins (all files have been parsed and hooks/tests are ready for execution)
     */
    EVENT_RUN_BEGIN: 'start',
    /**
     * Emitted when Root {@link Suite} execution has been delayed via `delay` option
     */
    EVENT_DELAY_BEGIN: 'waiting',
    /**
     * Emitted when delayed Root {@link Suite} execution is triggered by user via `global.run()`
     */
    EVENT_DELAY_END: 'ready',
    /**
     * Emitted when Root {@link Suite} execution ends
     */
    EVENT_RUN_END: 'end',
    /**
     * Emitted when {@link Suite} execution begins
     */
    EVENT_SUITE_BEGIN: 'suite',
    /**
     * Emitted when {@link Suite} execution ends
     */
    EVENT_SUITE_END: 'suite end',
    /**
     * Emitted when {@link Test} execution begins
     */
    EVENT_TEST_BEGIN: 'test',
    /**
     * Emitted when {@link Test} execution ends
     */
    EVENT_TEST_END: 'test end',
    /**
     * Emitted when {@link Test} execution fails
     */
    EVENT_TEST_FAIL: 'fail',
    /**
     * Emitted when {@link Test} execution succeeds
     */
    EVENT_TEST_PASS: 'pass',
    /**
     * Emitted when {@link Test} becomes pending
     */
    EVENT_TEST_PENDING: 'pending',
    /**
     * Emitted when {@link Test} execution has failed, but will retry
     */
    EVENT_TEST_RETRY: 'retry',
    /**
     * Initial state of Runner
     */
    STATE_IDLE: 'idle',
    /**
     * State set to this value when the Runner has started running
     */
    STATE_RUNNING: 'running',
    /**
     * State set to this value when the Runner has stopped
     */
    STATE_STOPPED: 'stopped'
  }
);

var runner = Runner;

/**
 * Initialize a `Runner` at the Root {@link Suite}, which represents a hierarchy of {@link Suite|Suites} and {@link Test|Tests}.
 *
 * @extends external:EventEmitter
 * @public
 * @class
 * @param {Suite} suite - Root suite
 * @param {Object|boolean} [opts] - Options. If `boolean`, whether or not to delay execution of root suite until ready (for backwards compatibility).
 * @param {boolean} [opts.delay] - Whether to delay execution of root suite until ready.
 * @param {boolean} [opts.cleanReferencesAfterRun] - Whether to clean references to test fns and hooks when a suite is done.
 */
function Runner(suite, opts) {
  if (opts === undefined) {
    opts = {};
  }
  if (typeof opts === 'boolean') {
    this._delay = opts;
    opts = {};
  } else {
    this._delay = opts.delay;
  }
  var self = this;
  this._globals = [];
  this._abort = false;
  this.suite = suite;
  this._opts = opts;
  this.state = constants$2.STATE_IDLE;
  this.total = suite.total();
  this.failures = 0;
  this._eventListeners = [];
  this.on(constants$2.EVENT_TEST_END, function(test) {
    if (test.type === 'test' && test.retriedTest() && test.parent) {
      var idx =
        test.parent.tests && test.parent.tests.indexOf(test.retriedTest());
      if (idx > -1) test.parent.tests[idx] = test;
    }
    self.checkGlobals(test);
  });
  this.on(constants$2.EVENT_HOOK_END, function(hook) {
    self.checkGlobals(hook);
  });
  this._defaultGrep = /.*/;
  this.grep(this._defaultGrep);
  this.globals(this.globalProps());

  this.uncaught = this._uncaught.bind(this);
}

/**
 * Wrapper for setImmediate, process.nextTick, or browser polyfill.
 *
 * @param {Function} fn
 * @private
 */
Runner.immediately = commonjsGlobal.setImmediate || process.nextTick;

/**
 * Inherit from `EventEmitter.prototype`.
 */
inherits$1(Runner, EventEmitter$1);

/**
 * Replacement for `target.on(eventName, listener)` that does bookkeeping to remove them when this runner instance is disposed.
 * @param {EventEmitter} target - The `EventEmitter`
 * @param {string} eventName - The event name
 * @param {string} fn - Listener function
 * @private
 */
Runner.prototype._addEventListener = function(target, eventName, listener) {
  target.on(eventName, listener);
  this._eventListeners.push([target, eventName, listener]);
};

/**
 * Replacement for `target.removeListener(eventName, listener)` that also updates the bookkeeping.
 * @param {EventEmitter} target - The `EventEmitter`
 * @param {string} eventName - The event anme
 * @param {function} listener - Listener function
 * @private
 */
Runner.prototype._removeEventListener = function(target, eventName, listener) {
  var eventListenerIndex = -1;
  for (var i = 0; i < this._eventListeners.length; i++) {
    var eventListenerDescriptor = this._eventListeners[i];
    if (
      eventListenerDescriptor[0] === target &&
      eventListenerDescriptor[1] === eventName &&
      eventListenerDescriptor[2] === listener
    ) {
      eventListenerIndex = i;
      break;
    }
  }
  if (eventListenerIndex !== -1) {
    var removedListener = this._eventListeners.splice(eventListenerIndex, 1)[0];
    removedListener[0].removeListener(removedListener[1], removedListener[2]);
  }
};

/**
 * Removes all event handlers set during a run on this instance.
 * Remark: this does _not_ clean/dispose the tests or suites themselves.
 */
Runner.prototype.dispose = function() {
  this.removeAllListeners();
  this._eventListeners.forEach(function(eventListenerDescriptor) {
    eventListenerDescriptor[0].removeListener(
      eventListenerDescriptor[1],
      eventListenerDescriptor[2]
    );
  });
};

/**
 * Run tests with full titles matching `re`. Updates runner.total
 * with number of tests matched.
 *
 * @public
 * @memberof Runner
 * @param {RegExp} re
 * @param {boolean} invert
 * @return {Runner} Runner instance.
 */
Runner.prototype.grep = function(re, invert) {
  debug$1('grep(): setting to %s', re);
  this._grep = re;
  this._invert = invert;
  this.total = this.grepTotal(this.suite);
  return this;
};

/**
 * Returns the number of tests matching the grep search for the
 * given suite.
 *
 * @memberof Runner
 * @public
 * @param {Suite} suite
 * @return {number}
 */
Runner.prototype.grepTotal = function(suite) {
  var self = this;
  var total = 0;

  suite.eachTest(function(test) {
    var match = self._grep.test(test.fullTitle());
    if (self._invert) {
      match = !match;
    }
    if (match) {
      total++;
    }
  });

  return total;
};

/**
 * Return a list of global properties.
 *
 * @return {Array}
 * @private
 */
Runner.prototype.globalProps = function() {
  var props = Object.keys(commonjsGlobal);

  // non-enumerables
  for (var i = 0; i < globals.length; ++i) {
    if (~props.indexOf(globals[i])) {
      continue;
    }
    props.push(globals[i]);
  }

  return props;
};

/**
 * Allow the given `arr` of globals.
 *
 * @public
 * @memberof Runner
 * @param {Array} arr
 * @return {Runner} Runner instance.
 */
Runner.prototype.globals = function(arr) {
  if (!arguments.length) {
    return this._globals;
  }
  debug$1('globals(): setting to %O', arr);
  this._globals = this._globals.concat(arr);
  return this;
};

/**
 * Check for global variable leaks.
 *
 * @private
 */
Runner.prototype.checkGlobals = function(test) {
  if (!this.checkLeaks) {
    return;
  }
  var ok = this._globals;

  var globals = this.globalProps();
  var leaks;

  if (test) {
    ok = ok.concat(test._allowedGlobals || []);
  }

  if (this.prevGlobalsLength === globals.length) {
    return;
  }
  this.prevGlobalsLength = globals.length;

  leaks = filterLeaks(ok, globals);
  this._globals = this._globals.concat(leaks);

  if (leaks.length) {
    var msg = 'global leak(s) detected: %s';
    var error = new Error(util.format(msg, leaks.map(sQuote).join(', ')));
    this.fail(test, error);
  }
};

/**
 * Fail the given `test`.
 *
 * If `test` is a hook, failures work in the following pattern:
 * - If bail, run corresponding `after each` and `after` hooks,
 *   then exit
 * - Failed `before` hook skips all tests in a suite and subsuites,
 *   but jumps to corresponding `after` hook
 * - Failed `before each` hook skips remaining tests in a
 *   suite and jumps to corresponding `after each` hook,
 *   which is run only once
 * - Failed `after` hook does not alter execution order
 * - Failed `after each` hook skips remaining tests in a
 *   suite and subsuites, but executes other `after each`
 *   hooks
 *
 * @private
 * @param {Runnable} test
 * @param {Error} err
 * @param {boolean} [force=false] - Whether to fail a pending test.
 */
Runner.prototype.fail = function(test, err, force) {
  force = force === true;
  if (test.isPending() && !force) {
    return;
  }
  if (this.state === constants$2.STATE_STOPPED) {
    if (err.code === errors.constants.MULTIPLE_DONE) {
      throw err;
    }
    throw createFatalError$1(
      'Test failed after root suite execution completed!',
      err
    );
  }

  ++this.failures;
  debug$1('total number of failures: %d', this.failures);
  test.state = STATE_FAILED;

  if (!isError(err)) {
    err = thrown2Error(err);
  }

  try {
    err.stack =
      this.fullStackTrace || !err.stack ? err.stack : stackFilter(err.stack);
  } catch (ignore) {
    // some environments do not take kindly to monkeying with the stack
  }

  this.emit(constants$2.EVENT_TEST_FAIL, test, err);
};

/**
 * Run hook `name` callbacks and then invoke `fn()`.
 *
 * @private
 * @param {string} name
 * @param {Function} fn
 */

Runner.prototype.hook = function(name, fn) {
  var suite = this.suite;
  var hooks = suite.getHooks(name);
  var self = this;

  function next(i) {
    var hook = hooks[i];
    if (!hook) {
      return fn();
    }
    self.currentRunnable = hook;

    if (name === HOOK_TYPE_BEFORE_ALL) {
      hook.ctx.currentTest = hook.parent.tests[0];
    } else if (name === HOOK_TYPE_AFTER_ALL) {
      hook.ctx.currentTest = hook.parent.tests[hook.parent.tests.length - 1];
    } else {
      hook.ctx.currentTest = self.test;
    }

    setHookTitle(hook);

    hook.allowUncaught = self.allowUncaught;

    self.emit(constants$2.EVENT_HOOK_BEGIN, hook);

    if (!hook.listeners('error').length) {
      self._addEventListener(hook, 'error', function(err) {
        self.fail(hook, err);
      });
    }

    hook.run(function cbHookRun(err) {
      var testError = hook.error();
      if (testError) {
        self.fail(self.test, testError);
      }
      // conditional skip
      if (hook.pending) {
        if (name === HOOK_TYPE_AFTER_EACH) {
          // TODO define and implement use case
          if (self.test) {
            self.test.pending = true;
          }
        } else if (name === HOOK_TYPE_BEFORE_EACH) {
          if (self.test) {
            self.test.pending = true;
          }
          self.emit(constants$2.EVENT_HOOK_END, hook);
          hook.pending = false; // activates hook for next test
          return fn(new Error('abort hookDown'));
        } else if (name === HOOK_TYPE_BEFORE_ALL) {
          suite.tests.forEach(function(test) {
            test.pending = true;
          });
          suite.suites.forEach(function(suite) {
            suite.pending = true;
          });
          hooks = [];
        } else {
          hook.pending = false;
          var errForbid = createUnsupportedError$1('`this.skip` forbidden');
          self.fail(hook, errForbid);
          return fn(errForbid);
        }
      } else if (err) {
        self.fail(hook, err);
        // stop executing hooks, notify callee of hook err
        return fn(err);
      }
      self.emit(constants$2.EVENT_HOOK_END, hook);
      delete hook.ctx.currentTest;
      setHookTitle(hook);
      next(++i);
    });

    function setHookTitle(hook) {
      hook.originalTitle = hook.originalTitle || hook.title;
      if (hook.ctx && hook.ctx.currentTest) {
        hook.title =
          hook.originalTitle + ' for ' + dQuote(hook.ctx.currentTest.title);
      } else {
        var parentTitle;
        if (hook.parent.title) {
          parentTitle = hook.parent.title;
        } else {
          parentTitle = hook.parent.root ? '{root}' : '';
        }
        hook.title = hook.originalTitle + ' in ' + dQuote(parentTitle);
      }
    }
  }

  Runner.immediately(function() {
    next(0);
  });
};

/**
 * Run hook `name` for the given array of `suites`
 * in order, and callback `fn(err, errSuite)`.
 *
 * @private
 * @param {string} name
 * @param {Array} suites
 * @param {Function} fn
 */
Runner.prototype.hooks = function(name, suites, fn) {
  var self = this;
  var orig = this.suite;

  function next(suite) {
    self.suite = suite;

    if (!suite) {
      self.suite = orig;
      return fn();
    }

    self.hook(name, function(err) {
      if (err) {
        var errSuite = self.suite;
        self.suite = orig;
        return fn(err, errSuite);
      }

      next(suites.pop());
    });
  }

  next(suites.pop());
};

/**
 * Run hooks from the top level down.
 *
 * @param {String} name
 * @param {Function} fn
 * @private
 */
Runner.prototype.hookUp = function(name, fn) {
  var suites = [this.suite].concat(this.parents()).reverse();
  this.hooks(name, suites, fn);
};

/**
 * Run hooks from the bottom up.
 *
 * @param {String} name
 * @param {Function} fn
 * @private
 */
Runner.prototype.hookDown = function(name, fn) {
  var suites = [this.suite].concat(this.parents());
  this.hooks(name, suites, fn);
};

/**
 * Return an array of parent Suites from
 * closest to furthest.
 *
 * @return {Array}
 * @private
 */
Runner.prototype.parents = function() {
  var suite = this.suite;
  var suites = [];
  while (suite.parent) {
    suite = suite.parent;
    suites.push(suite);
  }
  return suites;
};

/**
 * Run the current test and callback `fn(err)`.
 *
 * @param {Function} fn
 * @private
 */
Runner.prototype.runTest = function(fn) {
  var self = this;
  var test = this.test;

  if (!test) {
    return;
  }

  if (this.asyncOnly) {
    test.asyncOnly = true;
  }
  this._addEventListener(test, 'error', function(err) {
    self.fail(test, err);
  });
  if (this.allowUncaught) {
    test.allowUncaught = true;
    return test.run(fn);
  }
  try {
    test.run(fn);
  } catch (err) {
    fn(err);
  }
};

/**
 * Run tests in the given `suite` and invoke the callback `fn()` when complete.
 *
 * @private
 * @param {Suite} suite
 * @param {Function} fn
 */
Runner.prototype.runTests = function(suite, fn) {
  var self = this;
  var tests = suite.tests.slice();
  var test;

  function hookErr(_, errSuite, after) {
    // before/after Each hook for errSuite failed:
    var orig = self.suite;

    // for failed 'after each' hook start from errSuite parent,
    // otherwise start from errSuite itself
    self.suite = after ? errSuite.parent : errSuite;

    if (self.suite) {
      // call hookUp afterEach
      self.hookUp(HOOK_TYPE_AFTER_EACH, function(err2, errSuite2) {
        self.suite = orig;
        // some hooks may fail even now
        if (err2) {
          return hookErr(err2, errSuite2, true);
        }
        // report error suite
        fn(errSuite);
      });
    } else {
      // there is no need calling other 'after each' hooks
      self.suite = orig;
      fn(errSuite);
    }
  }

  function next(err, errSuite) {
    // if we bail after first err
    if (self.failures && suite._bail) {
      tests = [];
    }

    if (self._abort) {
      return fn();
    }

    if (err) {
      return hookErr(err, errSuite, true);
    }

    // next test
    test = tests.shift();

    // all done
    if (!test) {
      return fn();
    }

    // grep
    var match = self._grep.test(test.fullTitle());
    if (self._invert) {
      match = !match;
    }
    if (!match) {
      // Run immediately only if we have defined a grep. When we
      // define a grep — It can cause maximum callstack error if
      // the grep is doing a large recursive loop by neglecting
      // all tests. The run immediately function also comes with
      // a performance cost. So we don't want to run immediately
      // if we run the whole test suite, because running the whole
      // test suite don't do any immediate recursive loops. Thus,
      // allowing a JS runtime to breathe.
      if (self._grep !== self._defaultGrep) {
        Runner.immediately(next);
      } else {
        next();
      }
      return;
    }

    // static skip, no hooks are executed
    if (test.isPending()) {
      if (self.forbidPending) {
        self.fail(test, new Error('Pending test forbidden'), true);
      } else {
        test.state = STATE_PENDING;
        self.emit(constants$2.EVENT_TEST_PENDING, test);
      }
      self.emit(constants$2.EVENT_TEST_END, test);
      return next();
    }

    // execute test and hook(s)
    self.emit(constants$2.EVENT_TEST_BEGIN, (self.test = test));
    self.hookDown(HOOK_TYPE_BEFORE_EACH, function(err, errSuite) {
      // conditional skip within beforeEach
      if (test.isPending()) {
        if (self.forbidPending) {
          self.fail(test, new Error('Pending test forbidden'), true);
        } else {
          test.state = STATE_PENDING;
          self.emit(constants$2.EVENT_TEST_PENDING, test);
        }
        self.emit(constants$2.EVENT_TEST_END, test);
        // skip inner afterEach hooks below errSuite level
        var origSuite = self.suite;
        self.suite = errSuite || self.suite;
        return self.hookUp(HOOK_TYPE_AFTER_EACH, function(e, eSuite) {
          self.suite = origSuite;
          next(e, eSuite);
        });
      }
      if (err) {
        return hookErr(err, errSuite, false);
      }
      self.currentRunnable = self.test;
      self.runTest(function(err) {
        test = self.test;
        // conditional skip within it
        if (test.pending) {
          if (self.forbidPending) {
            self.fail(test, new Error('Pending test forbidden'), true);
          } else {
            test.state = STATE_PENDING;
            self.emit(constants$2.EVENT_TEST_PENDING, test);
          }
          self.emit(constants$2.EVENT_TEST_END, test);
          return self.hookUp(HOOK_TYPE_AFTER_EACH, next);
        } else if (err) {
          var retry = test.currentRetry();
          if (retry < test.retries()) {
            var clonedTest = test.clone();
            clonedTest.currentRetry(retry + 1);
            tests.unshift(clonedTest);

            self.emit(constants$2.EVENT_TEST_RETRY, test, err);

            // Early return + hook trigger so that it doesn't
            // increment the count wrong
            return self.hookUp(HOOK_TYPE_AFTER_EACH, next);
          } else {
            self.fail(test, err);
          }
          self.emit(constants$2.EVENT_TEST_END, test);
          return self.hookUp(HOOK_TYPE_AFTER_EACH, next);
        }

        test.state = STATE_PASSED;
        self.emit(constants$2.EVENT_TEST_PASS, test);
        self.emit(constants$2.EVENT_TEST_END, test);
        self.hookUp(HOOK_TYPE_AFTER_EACH, next);
      });
    });
  }

  this.next = next;
  this.hookErr = hookErr;
  next();
};

/**
 * Run the given `suite` and invoke the callback `fn()` when complete.
 *
 * @private
 * @param {Suite} suite
 * @param {Function} fn
 */
Runner.prototype.runSuite = function(suite, fn) {
  var i = 0;
  var self = this;
  var total = this.grepTotal(suite);

  debug$1('runSuite(): running %s', suite.fullTitle());

  if (!total || (self.failures && suite._bail)) {
    debug$1('runSuite(): bailing');
    return fn();
  }

  this.emit(constants$2.EVENT_SUITE_BEGIN, (this.suite = suite));

  function next(errSuite) {
    if (errSuite) {
      // current suite failed on a hook from errSuite
      if (errSuite === suite) {
        // if errSuite is current suite
        // continue to the next sibling suite
        return done();
      }
      // errSuite is among the parents of current suite
      // stop execution of errSuite and all sub-suites
      return done(errSuite);
    }

    if (self._abort) {
      return done();
    }

    var curr = suite.suites[i++];
    if (!curr) {
      return done();
    }

    // Avoid grep neglecting large number of tests causing a
    // huge recursive loop and thus a maximum call stack error.
    // See comment in `this.runTests()` for more information.
    if (self._grep !== self._defaultGrep) {
      Runner.immediately(function() {
        self.runSuite(curr, next);
      });
    } else {
      self.runSuite(curr, next);
    }
  }

  function done(errSuite) {
    self.suite = suite;
    self.nextSuite = next;

    // remove reference to test
    delete self.test;

    self.hook(HOOK_TYPE_AFTER_ALL, function() {
      self.emit(constants$2.EVENT_SUITE_END, suite);
      fn(errSuite);
    });
  }

  this.nextSuite = next;

  this.hook(HOOK_TYPE_BEFORE_ALL, function(err) {
    if (err) {
      return done();
    }
    self.runTests(suite, next);
  });
};

/**
 * Handle uncaught exceptions within runner.
 *
 * This function is bound to the instance as `Runner#uncaught` at instantiation
 * time. It's intended to be listening on the `Process.uncaughtException` event.
 * In order to not leak EE listeners, we need to ensure no more than a single
 * `uncaughtException` listener exists per `Runner`.  The only way to do
 * this--because this function needs the context (and we don't have lambdas)--is
 * to use `Function.prototype.bind`. We need strict equality to unregister and
 * _only_ unregister the _one_ listener we set from the
 * `Process.uncaughtException` event; would be poor form to just remove
 * everything. See {@link Runner#run} for where the event listener is registered
 * and unregistered.
 * @param {Error} err - Some uncaught error
 * @private
 */
Runner.prototype._uncaught = function(err) {
  // this is defensive to prevent future developers from mis-calling this function.
  // it's more likely that it'd be called with the incorrect context--say, the global
  // `process` object--than it would to be called with a context that is not a "subclass"
  // of `Runner`.
  if (!(this instanceof Runner)) {
    throw createFatalError$1(
      'Runner#uncaught() called with invalid context',
      this
    );
  }
  if (err instanceof pending) {
    debug$1('uncaught(): caught a Pending');
    return;
  }
  // browser does not exit script when throwing in global.onerror()
  if (this.allowUncaught && !utils.isBrowser()) {
    debug$1('uncaught(): bubbling exception due to --allow-uncaught');
    throw err;
  }

  if (this.state === constants$2.STATE_STOPPED) {
    debug$1('uncaught(): throwing after run has completed!');
    throw err;
  }

  if (err) {
    debug$1('uncaught(): got truthy exception %O', err);
  } else {
    debug$1('uncaught(): undefined/falsy exception');
    err = createInvalidExceptionError$2(
      'Caught falsy/undefined exception which would otherwise be uncaught. No stack trace found; try a debugger',
      err
    );
  }

  if (!isError(err)) {
    err = thrown2Error(err);
    debug$1('uncaught(): converted "error" %o to Error', err);
  }
  err.uncaught = true;

  var runnable$1 = this.currentRunnable;

  if (!runnable$1) {
    runnable$1 = new runnable('Uncaught error outside test suite');
    debug$1('uncaught(): no current Runnable; created a phony one');
    runnable$1.parent = this.suite;

    if (this.state === constants$2.STATE_RUNNING) {
      debug$1('uncaught(): failing gracefully');
      this.fail(runnable$1, err);
    } else {
      // Can't recover from this failure
      debug$1('uncaught(): test run has not yet started; unrecoverable');
      this.emit(constants$2.EVENT_RUN_BEGIN);
      this.fail(runnable$1, err);
      this.emit(constants$2.EVENT_RUN_END);
    }

    return;
  }

  runnable$1.clearTimeout();

  if (runnable$1.isFailed()) {
    debug$1('uncaught(): Runnable has already failed');
    // Ignore error if already failed
    return;
  } else if (runnable$1.isPending()) {
    debug$1('uncaught(): pending Runnable wound up failing!');
    // report 'pending test' retrospectively as failed
    this.fail(runnable$1, err, true);
    return;
  }

  // we cannot recover gracefully if a Runnable has already passed
  // then fails asynchronously
  if (runnable$1.isPassed()) {
    debug$1('uncaught(): Runnable has already passed; bailing gracefully');
    this.fail(runnable$1, err);
    this.abort();
  } else {
    debug$1('uncaught(): forcing Runnable to complete with Error');
    return runnable$1.callback(err);
  }
};

/**
 * Run the root suite and invoke `fn(failures)`
 * on completion.
 *
 * @public
 * @memberof Runner
 * @param {Function} fn - Callback when finished
 * @param {{files: string[], options: Options}} [opts] - For subclasses
 * @return {Runner} Runner instance.
 */
Runner.prototype.run = function(fn, opts) {
  var self = this;
  var rootSuite = this.suite;

  fn = fn || function() {};

  function start() {
    debug$1('run(): starting');
    // If there is an `only` filter
    if (rootSuite.hasOnly()) {
      rootSuite.filterOnly();
      debug$1('run(): filtered exclusive Runnables');
    }
    self.state = constants$2.STATE_RUNNING;
    if (self._delay) {
      self.emit(constants$2.EVENT_DELAY_END);
      debug$1('run(): "delay" ended');
    }
    debug$1('run(): emitting %s', constants$2.EVENT_RUN_BEGIN);
    self.emit(constants$2.EVENT_RUN_BEGIN);
    debug$1('run(): emitted %s', constants$2.EVENT_RUN_BEGIN);

    self.runSuite(rootSuite, function() {
      debug$1(
        'run(): root suite completed; emitting %s',
        constants$2.EVENT_RUN_END
      );
      self.emit(constants$2.EVENT_RUN_END);
      debug$1('run(): emitted %s', constants$2.EVENT_RUN_END);
    });
  }

  // references cleanup to avoid memory leaks
  if (this._opts.cleanReferencesAfterRun) {
    this.on(constants$2.EVENT_SUITE_END, function(suite) {
      suite.cleanReferences();
    });
  }

  // callback
  this.on(constants$2.EVENT_RUN_END, function() {
    self.state = constants$2.STATE_STOPPED;
    debug$1(constants$2.EVENT_RUN_END);
    debug$1('run(): emitted %s', constants$2.EVENT_RUN_END);
    fn(self.failures);
  });

  self._removeEventListener(process, 'uncaughtException', self.uncaught);
  self._addEventListener(process, 'uncaughtException', self.uncaught);

  if (this._delay) {
    // for reporters, I guess.
    // might be nice to debounce some dots while we wait.
    this.emit(constants$2.EVENT_DELAY_BEGIN, rootSuite);
    rootSuite.once(EVENT_ROOT_SUITE_RUN, start);
    debug$1('run(): waiting for green light due to --delay');
  } else {
    Runner.immediately(function() {
      start();
    });
  }

  return this;
};

/**
 * Cleanly abort execution.
 *
 * @memberof Runner
 * @public
 * @return {Runner} Runner instance.
 */
Runner.prototype.abort = function() {
  debug$1('abort(): aborting');
  this._abort = true;

  return this;
};

/**
 * Filter leaks with the given globals flagged as `ok`.
 *
 * @private
 * @param {Array} ok
 * @param {Array} globals
 * @return {Array}
 */
function filterLeaks(ok, globals) {
  return globals.filter(function(key) {
    // Firefox and Chrome exposes iframes as index inside the window object
    if (/^\d+/.test(key)) {
      return false;
    }

    // in firefox
    // if runner runs in an iframe, this iframe's window.getInterface method
    // not init at first it is assigned in some seconds
    if (commonjsGlobal.navigator && /^getInterface/.test(key)) {
      return false;
    }

    // an iframe could be approached by window[iframeIndex]
    // in ie6,7,8 and opera, iframeIndex is enumerable, this could cause leak
    if (commonjsGlobal.navigator && /^\d+/.test(key)) {
      return false;
    }

    // Opera and IE expose global variables for HTML element IDs (issue #243)
    if (/^mocha-/.test(key)) {
      return false;
    }

    var matched = ok.filter(function(ok) {
      if (~ok.indexOf('*')) {
        return key.indexOf(ok.split('*')[0]) === 0;
      }
      return key === ok;
    });
    return !matched.length && (!commonjsGlobal.navigator || key !== 'onerror');
  });
}

/**
 * Check if argument is an instance of Error object or a duck-typed equivalent.
 *
 * @private
 * @param {Object} err - object to check
 * @param {string} err.message - error message
 * @returns {boolean}
 */
function isError(err) {
  return err instanceof Error || (err && typeof err.message === 'string');
}

/**
 *
 * Converts thrown non-extensible type into proper Error.
 *
 * @private
 * @param {*} thrown - Non-extensible type thrown by code
 * @return {Error}
 */
function thrown2Error(err) {
  return new Error(
    'the ' + type(err) + ' ' + stringify(err) + ' was thrown, throw an Error :)'
  );
}

Runner.constants = constants$2;

var diff = getCjsExportFromNamespace(index_es6);

var base = createCommonjsModule(function (module, exports) {
/**
 * @module Base
 */
/**
 * Module dependencies.
 */





var constants = runner.constants;
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;
var EVENT_TEST_FAIL = constants.EVENT_TEST_FAIL;

const isBrowser = utils.isBrowser();

function getBrowserWindowSize() {
  if ('innerHeight' in commonjsGlobal) {
    return [commonjsGlobal.innerHeight, commonjsGlobal.innerWidth];
  }
  // In a Web Worker, the DOM Window is not available.
  return [640, 480];
}

/**
 * Expose `Base`.
 */

exports = module.exports = Base;

/**
 * Check if both stdio streams are associated with a tty.
 */

var isatty = isBrowser || (process.stdout.isTTY && process.stderr.isTTY);

/**
 * Save log references to avoid tests interfering (see GH-3604).
 */
var consoleLog = console.log;

/**
 * Enable coloring by default, except in the browser interface.
 */

exports.useColors =
  !isBrowser &&
  (supportsColor_1.stdout || process.env.MOCHA_COLORS !== undefined);

/**
 * Inline diffs instead of +/-
 */

exports.inlineDiffs = false;

/**
 * Default color map.
 */

exports.colors = {
  pass: 90,
  fail: 31,
  'bright pass': 92,
  'bright fail': 91,
  'bright yellow': 93,
  pending: 36,
  suite: 0,
  'error title': 0,
  'error message': 31,
  'error stack': 90,
  checkmark: 32,
  fast: 90,
  medium: 33,
  slow: 31,
  green: 32,
  light: 90,
  'diff gutter': 90,
  'diff added': 32,
  'diff removed': 31,
  'diff added inline': '30;42',
  'diff removed inline': '30;41'
};

/**
 * Default symbol map.
 */

exports.symbols = {
  ok: '✓',
  err: '✖',
  dot: '․',
  comma: ',',
  bang: '!'
};

// With node.js on Windows: use symbols available in terminal default fonts
if (process.platform === 'win32') {
  exports.symbols.ok = '\u221A';
  exports.symbols.err = '\u00D7';
  exports.symbols.dot = '.';
}

/**
 * Color `str` with the given `type`,
 * allowing colors to be disabled,
 * as well as user-defined color
 * schemes.
 *
 * @private
 * @param {string} type
 * @param {string} str
 * @return {string}
 */
var color = (exports.color = function(type, str) {
  if (!exports.useColors) {
    return String(str);
  }
  return '\u001b[' + exports.colors[type] + 'm' + str + '\u001b[0m';
});

/**
 * Expose term window size, with some defaults for when stderr is not a tty.
 */

exports.window = {
  width: 75
};

if (isatty) {
  if (isBrowser) {
    exports.window.width = getBrowserWindowSize()[1];
  } else {
    exports.window.width = process.stdout.getWindowSize(1)[0];
  }
}

/**
 * Expose some basic cursor interactions that are common among reporters.
 */

exports.cursor = {
  hide: function() {
    isatty && process.stdout.write('\u001b[?25l');
  },

  show: function() {
    isatty && process.stdout.write('\u001b[?25h');
  },

  deleteLine: function() {
    isatty && process.stdout.write('\u001b[2K');
  },

  beginningOfLine: function() {
    isatty && process.stdout.write('\u001b[0G');
  },

  CR: function() {
    if (isatty) {
      exports.cursor.deleteLine();
      exports.cursor.beginningOfLine();
    } else {
      process.stdout.write('\r');
    }
  }
};

var showDiff = (exports.showDiff = function(err) {
  return (
    err &&
    err.showDiff !== false &&
    sameType(err.actual, err.expected) &&
    err.expected !== undefined
  );
});

function stringifyDiffObjs(err) {
  if (!utils.isString(err.actual) || !utils.isString(err.expected)) {
    err.actual = utils.stringify(err.actual);
    err.expected = utils.stringify(err.expected);
  }
}

/**
 * Returns a diff between 2 strings with coloured ANSI output.
 *
 * @description
 * The diff will be either inline or unified dependent on the value
 * of `Base.inlineDiff`.
 *
 * @param {string} actual
 * @param {string} expected
 * @return {string} Diff
 */
var generateDiff = (exports.generateDiff = function(actual, expected) {
  try {
    return exports.inlineDiffs
      ? inlineDiff(actual, expected)
      : unifiedDiff(actual, expected);
  } catch (err) {
    var msg =
      '\n      ' +
      color('diff added', '+ expected') +
      ' ' +
      color('diff removed', '- actual:  failed to generate Mocha diff') +
      '\n';
    return msg;
  }
});

/**
 * Outputs the given `failures` as a list.
 *
 * @public
 * @memberof Mocha.reporters.Base
 * @variation 1
 * @param {Object[]} failures - Each is Test instance with corresponding
 *     Error property
 */
exports.list = function(failures) {
  var multipleErr, multipleTest;
  Base.consoleLog();
  failures.forEach(function(test, i) {
    // format
    var fmt =
      color('error title', '  %s) %s:\n') +
      color('error message', '     %s') +
      color('error stack', '\n%s\n');

    // msg
    var msg;
    var err;
    if (test.err && test.err.multiple) {
      if (multipleTest !== test) {
        multipleTest = test;
        multipleErr = [test.err].concat(test.err.multiple);
      }
      err = multipleErr.shift();
    } else {
      err = test.err;
    }
    var message;
    if (err.message && typeof err.message.toString === 'function') {
      message = err.message + '';
    } else if (typeof err.inspect === 'function') {
      message = err.inspect() + '';
    } else {
      message = '';
    }
    var stack = err.stack || message;
    var index = message ? stack.indexOf(message) : -1;

    if (index === -1) {
      msg = message;
    } else {
      index += message.length;
      msg = stack.slice(0, index);
      // remove msg from stack
      stack = stack.slice(index + 1);
    }

    // uncaught
    if (err.uncaught) {
      msg = 'Uncaught ' + msg;
    }
    // explicitly show diff
    if (!exports.hideDiff && showDiff(err)) {
      stringifyDiffObjs(err);
      fmt =
        color('error title', '  %s) %s:\n%s') + color('error stack', '\n%s\n');
      var match = message.match(/^([^:]+): expected/);
      msg = '\n      ' + color('error message', match ? match[1] : msg);

      msg += generateDiff(err.actual, err.expected);
    }

    // indent stack trace
    stack = stack.replace(/^/gm, '  ');

    // indented test title
    var testTitle = '';
    test.titlePath().forEach(function(str, index) {
      if (index !== 0) {
        testTitle += '\n     ';
      }
      for (var i = 0; i < index; i++) {
        testTitle += '  ';
      }
      testTitle += str;
    });

    Base.consoleLog(fmt, i + 1, testTitle, msg, stack);
  });
};

/**
 * Constructs a new `Base` reporter instance.
 *
 * @description
 * All other reporters generally inherit from this reporter.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function Base(runner, options) {
  var failures = (this.failures = []);

  if (!runner) {
    throw new TypeError('Missing runner argument');
  }
  this.options = options || {};
  this.runner = runner;
  this.stats = runner.stats; // assigned so Reporters keep a closer reference

  runner.on(EVENT_TEST_PASS, function(test) {
    if (test.duration > test.slow()) {
      test.speed = 'slow';
    } else if (test.duration > test.slow() / 2) {
      test.speed = 'medium';
    } else {
      test.speed = 'fast';
    }
  });

  runner.on(EVENT_TEST_FAIL, function(test, err) {
    if (showDiff(err)) {
      stringifyDiffObjs(err);
    }
    // more than one error per test
    if (test.err && err instanceof Error) {
      test.err.multiple = (test.err.multiple || []).concat(err);
    } else {
      test.err = err;
    }
    failures.push(test);
  });
}

/**
 * Outputs common epilogue used by many of the bundled reporters.
 *
 * @public
 * @memberof Mocha.reporters
 */
Base.prototype.epilogue = function() {
  var stats = this.stats;
  var fmt;

  Base.consoleLog();

  // passes
  fmt =
    color('bright pass', ' ') +
    color('green', ' %d passing') +
    color('light', ' (%s)');

  Base.consoleLog(fmt, stats.passes || 0, ms(stats.duration));

  // pending
  if (stats.pending) {
    fmt = color('pending', ' ') + color('pending', ' %d pending');

    Base.consoleLog(fmt, stats.pending);
  }

  // failures
  if (stats.failures) {
    fmt = color('fail', '  %d failing');

    Base.consoleLog(fmt, stats.failures);

    Base.list(this.failures);
    Base.consoleLog();
  }

  Base.consoleLog();
};

/**
 * Pads the given `str` to `len`.
 *
 * @private
 * @param {string} str
 * @param {string} len
 * @return {string}
 */
function pad(str, len) {
  str = String(str);
  return Array(len - str.length + 1).join(' ') + str;
}

/**
 * Returns inline diff between 2 strings with coloured ANSI output.
 *
 * @private
 * @param {String} actual
 * @param {String} expected
 * @return {string} Diff
 */
function inlineDiff(actual, expected) {
  var msg = errorDiff(actual, expected);

  // linenos
  var lines = msg.split('\n');
  if (lines.length > 4) {
    var width = String(lines.length).length;
    msg = lines
      .map(function(str, i) {
        return pad(++i, width) + ' |' + ' ' + str;
      })
      .join('\n');
  }

  // legend
  msg =
    '\n' +
    color('diff removed inline', 'actual') +
    ' ' +
    color('diff added inline', 'expected') +
    '\n\n' +
    msg +
    '\n';

  // indent
  msg = msg.replace(/^/gm, '      ');
  return msg;
}

/**
 * Returns unified diff between two strings with coloured ANSI output.
 *
 * @private
 * @param {String} actual
 * @param {String} expected
 * @return {string} The diff.
 */
function unifiedDiff(actual, expected) {
  var indent = '      ';
  function cleanUp(line) {
    if (line[0] === '+') {
      return indent + colorLines('diff added', line);
    }
    if (line[0] === '-') {
      return indent + colorLines('diff removed', line);
    }
    if (line.match(/@@/)) {
      return '--';
    }
    if (line.match(/\\ No newline/)) {
      return null;
    }
    return indent + line;
  }
  function notBlank(line) {
    return typeof line !== 'undefined' && line !== null;
  }
  var msg = diff.createPatch('string', actual, expected);
  var lines = msg.split('\n').splice(5);
  return (
    '\n      ' +
    colorLines('diff added', '+ expected') +
    ' ' +
    colorLines('diff removed', '- actual') +
    '\n\n' +
    lines
      .map(cleanUp)
      .filter(notBlank)
      .join('\n')
  );
}

/**
 * Returns character diff for `err`.
 *
 * @private
 * @param {String} actual
 * @param {String} expected
 * @return {string} the diff
 */
function errorDiff(actual, expected) {
  return diff
    .diffWordsWithSpace(actual, expected)
    .map(function(str) {
      if (str.added) {
        return colorLines('diff added inline', str.value);
      }
      if (str.removed) {
        return colorLines('diff removed inline', str.value);
      }
      return str.value;
    })
    .join('');
}

/**
 * Colors lines for `str`, using the color `name`.
 *
 * @private
 * @param {string} name
 * @param {string} str
 * @return {string}
 */
function colorLines(name, str) {
  return str
    .split('\n')
    .map(function(str) {
      return color(name, str);
    })
    .join('\n');
}

/**
 * Object#toString reference.
 */
var objToString = Object.prototype.toString;

/**
 * Checks that a / b have the same type.
 *
 * @private
 * @param {Object} a
 * @param {Object} b
 * @return {boolean}
 */
function sameType(a, b) {
  return objToString.call(a) === objToString.call(b);
}

Base.consoleLog = consoleLog;

Base.abstract = true;
});

var dot = createCommonjsModule(function (module, exports) {
/**
 * @module Dot
 */
/**
 * Module dependencies.
 */


var inherits = utils.inherits;
var constants = runner.constants;
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;
var EVENT_TEST_FAIL = constants.EVENT_TEST_FAIL;
var EVENT_RUN_BEGIN = constants.EVENT_RUN_BEGIN;
var EVENT_TEST_PENDING = constants.EVENT_TEST_PENDING;
var EVENT_RUN_END = constants.EVENT_RUN_END;

/**
 * Expose `Dot`.
 */

exports = module.exports = Dot;

/**
 * Constructs a new `Dot` reporter instance.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function Dot(runner, options) {
  base.call(this, runner, options);

  var self = this;
  var width = (base.window.width * 0.75) | 0;
  var n = -1;

  runner.on(EVENT_RUN_BEGIN, function() {
    process.stdout.write('\n');
  });

  runner.on(EVENT_TEST_PENDING, function() {
    if (++n % width === 0) {
      process.stdout.write('\n  ');
    }
    process.stdout.write(base.color('pending', base.symbols.comma));
  });

  runner.on(EVENT_TEST_PASS, function(test) {
    if (++n % width === 0) {
      process.stdout.write('\n  ');
    }
    if (test.speed === 'slow') {
      process.stdout.write(base.color('bright yellow', base.symbols.dot));
    } else {
      process.stdout.write(base.color(test.speed, base.symbols.dot));
    }
  });

  runner.on(EVENT_TEST_FAIL, function() {
    if (++n % width === 0) {
      process.stdout.write('\n  ');
    }
    process.stdout.write(base.color('fail', base.symbols.bang));
  });

  runner.once(EVENT_RUN_END, function() {
    process.stdout.write('\n');
    self.epilogue();
  });
}

/**
 * Inherit from `Base.prototype`.
 */
inherits(Dot, base);

Dot.description = 'dot matrix representation';
});

var doc = createCommonjsModule(function (module, exports) {
/**
 * @module Doc
 */
/**
 * Module dependencies.
 */



var constants = runner.constants;
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;
var EVENT_TEST_FAIL = constants.EVENT_TEST_FAIL;
var EVENT_SUITE_BEGIN = constants.EVENT_SUITE_BEGIN;
var EVENT_SUITE_END = constants.EVENT_SUITE_END;

/**
 * Expose `Doc`.
 */

exports = module.exports = Doc;

/**
 * Constructs a new `Doc` reporter instance.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function Doc(runner, options) {
  base.call(this, runner, options);

  var indents = 2;

  function indent() {
    return Array(indents).join('  ');
  }

  runner.on(EVENT_SUITE_BEGIN, function(suite) {
    if (suite.root) {
      return;
    }
    ++indents;
    base.consoleLog('%s<section class="suite">', indent());
    ++indents;
    base.consoleLog('%s<h1>%s</h1>', indent(), utils.escape(suite.title));
    base.consoleLog('%s<dl>', indent());
  });

  runner.on(EVENT_SUITE_END, function(suite) {
    if (suite.root) {
      return;
    }
    base.consoleLog('%s</dl>', indent());
    --indents;
    base.consoleLog('%s</section>', indent());
    --indents;
  });

  runner.on(EVENT_TEST_PASS, function(test) {
    base.consoleLog('%s  <dt>%s</dt>', indent(), utils.escape(test.title));
    base.consoleLog('%s  <dt>%s</dt>', indent(), utils.escape(test.file));
    var code = utils.escape(utils.clean(test.body));
    base.consoleLog('%s  <dd><pre><code>%s</code></pre></dd>', indent(), code);
  });

  runner.on(EVENT_TEST_FAIL, function(test, err) {
    base.consoleLog(
      '%s  <dt class="error">%s</dt>',
      indent(),
      utils.escape(test.title)
    );
    base.consoleLog(
      '%s  <dt class="error">%s</dt>',
      indent(),
      utils.escape(test.file)
    );
    var code = utils.escape(utils.clean(test.body));
    base.consoleLog(
      '%s  <dd class="error"><pre><code>%s</code></pre></dd>',
      indent(),
      code
    );
    base.consoleLog(
      '%s  <dd class="error">%s</dd>',
      indent(),
      utils.escape(err)
    );
  });
}

Doc.description = 'HTML documentation';
});

var tap = createCommonjsModule(function (module, exports) {
/**
 * @module TAP
 */
/**
 * Module dependencies.
 */



var constants = runner.constants;
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;
var EVENT_TEST_FAIL = constants.EVENT_TEST_FAIL;
var EVENT_RUN_BEGIN = constants.EVENT_RUN_BEGIN;
var EVENT_RUN_END = constants.EVENT_RUN_END;
var EVENT_TEST_PENDING = constants.EVENT_TEST_PENDING;
var EVENT_TEST_END = constants.EVENT_TEST_END;
var inherits = utils.inherits;
var sprintf = util.format;

/**
 * Expose `TAP`.
 */

exports = module.exports = TAP;

/**
 * Constructs a new `TAP` reporter instance.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function TAP(runner, options) {
  base.call(this, runner, options);

  var self = this;
  var n = 1;

  var tapVersion = '12';
  if (options && options.reporterOptions) {
    if (options.reporterOptions.tapVersion) {
      tapVersion = options.reporterOptions.tapVersion.toString();
    }
  }

  this._producer = createProducer(tapVersion);

  runner.once(EVENT_RUN_BEGIN, function() {
    self._producer.writeVersion();
  });

  runner.on(EVENT_TEST_END, function() {
    ++n;
  });

  runner.on(EVENT_TEST_PENDING, function(test) {
    self._producer.writePending(n, test);
  });

  runner.on(EVENT_TEST_PASS, function(test) {
    self._producer.writePass(n, test);
  });

  runner.on(EVENT_TEST_FAIL, function(test, err) {
    self._producer.writeFail(n, test, err);
  });

  runner.once(EVENT_RUN_END, function() {
    self._producer.writeEpilogue(runner.stats);
  });
}

/**
 * Inherit from `Base.prototype`.
 */
inherits(TAP, base);

/**
 * Returns a TAP-safe title of `test`.
 *
 * @private
 * @param {Test} test - Test instance.
 * @return {String} title with any hash character removed
 */
function title(test) {
  return test.fullTitle().replace(/#/g, '');
}

/**
 * Writes newline-terminated formatted string to reporter output stream.
 *
 * @private
 * @param {string} format - `printf`-like format string
 * @param {...*} [varArgs] - Format string arguments
 */
function println(format, varArgs) {
  var vargs = Array.from(arguments);
  vargs[0] += '\n';
  process.stdout.write(sprintf.apply(null, vargs));
}

/**
 * Returns a `tapVersion`-appropriate TAP producer instance, if possible.
 *
 * @private
 * @param {string} tapVersion - Version of TAP specification to produce.
 * @returns {TAPProducer} specification-appropriate instance
 * @throws {Error} if specification version has no associated producer.
 */
function createProducer(tapVersion) {
  var producers = {
    '12': new TAP12Producer(),
    '13': new TAP13Producer()
  };
  var producer = producers[tapVersion];

  if (!producer) {
    throw new Error(
      'invalid or unsupported TAP version: ' + JSON.stringify(tapVersion)
    );
  }

  return producer;
}

/**
 * @summary
 * Constructs a new TAPProducer.
 *
 * @description
 * <em>Only</em> to be used as an abstract base class.
 *
 * @private
 * @constructor
 */
function TAPProducer() {}

/**
 * Writes the TAP version to reporter output stream.
 *
 * @abstract
 */
TAPProducer.prototype.writeVersion = function() {};

/**
 * Writes the plan to reporter output stream.
 *
 * @abstract
 * @param {number} ntests - Number of tests that are planned to run.
 */
TAPProducer.prototype.writePlan = function(ntests) {
  println('%d..%d', 1, ntests);
};

/**
 * Writes that test passed to reporter output stream.
 *
 * @abstract
 * @param {number} n - Index of test that passed.
 * @param {Test} test - Instance containing test information.
 */
TAPProducer.prototype.writePass = function(n, test) {
  println('ok %d %s', n, title(test));
};

/**
 * Writes that test was skipped to reporter output stream.
 *
 * @abstract
 * @param {number} n - Index of test that was skipped.
 * @param {Test} test - Instance containing test information.
 */
TAPProducer.prototype.writePending = function(n, test) {
  println('ok %d %s # SKIP -', n, title(test));
};

/**
 * Writes that test failed to reporter output stream.
 *
 * @abstract
 * @param {number} n - Index of test that failed.
 * @param {Test} test - Instance containing test information.
 * @param {Error} err - Reason the test failed.
 */
TAPProducer.prototype.writeFail = function(n, test, err) {
  println('not ok %d %s', n, title(test));
};

/**
 * Writes the summary epilogue to reporter output stream.
 *
 * @abstract
 * @param {Object} stats - Object containing run statistics.
 */
TAPProducer.prototype.writeEpilogue = function(stats) {
  // :TBD: Why is this not counting pending tests?
  println('# tests ' + (stats.passes + stats.failures));
  println('# pass ' + stats.passes);
  // :TBD: Why are we not showing pending results?
  println('# fail ' + stats.failures);
  this.writePlan(stats.passes + stats.failures + stats.pending);
};

/**
 * @summary
 * Constructs a new TAP12Producer.
 *
 * @description
 * Produces output conforming to the TAP12 specification.
 *
 * @private
 * @constructor
 * @extends TAPProducer
 * @see {@link https://testanything.org/tap-specification.html|Specification}
 */
function TAP12Producer() {
  /**
   * Writes that test failed to reporter output stream, with error formatting.
   * @override
   */
  this.writeFail = function(n, test, err) {
    TAPProducer.prototype.writeFail.call(this, n, test, err);
    if (err.message) {
      println(err.message.replace(/^/gm, '  '));
    }
    if (err.stack) {
      println(err.stack.replace(/^/gm, '  '));
    }
  };
}

/**
 * Inherit from `TAPProducer.prototype`.
 */
inherits(TAP12Producer, TAPProducer);

/**
 * @summary
 * Constructs a new TAP13Producer.
 *
 * @description
 * Produces output conforming to the TAP13 specification.
 *
 * @private
 * @constructor
 * @extends TAPProducer
 * @see {@link https://testanything.org/tap-version-13-specification.html|Specification}
 */
function TAP13Producer() {
  /**
   * Writes the TAP version to reporter output stream.
   * @override
   */
  this.writeVersion = function() {
    println('TAP version 13');
  };

  /**
   * Writes that test failed to reporter output stream, with error formatting.
   * @override
   */
  this.writeFail = function(n, test, err) {
    TAPProducer.prototype.writeFail.call(this, n, test, err);
    var emitYamlBlock = err.message != null || err.stack != null;
    if (emitYamlBlock) {
      println(indent(1) + '---');
      if (err.message) {
        println(indent(2) + 'message: |-');
        println(err.message.replace(/^/gm, indent(3)));
      }
      if (err.stack) {
        println(indent(2) + 'stack: |-');
        println(err.stack.replace(/^/gm, indent(3)));
      }
      println(indent(1) + '...');
    }
  };

  function indent(level) {
    return Array(level + 1).join('  ');
  }
}

/**
 * Inherit from `TAPProducer.prototype`.
 */
inherits(TAP13Producer, TAPProducer);

TAP.description = 'TAP-compatible output';
});

var json = createCommonjsModule(function (module, exports) {
/**
 * @module JSON
 */
/**
 * Module dependencies.
 */


var constants = runner.constants;
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;
var EVENT_TEST_FAIL = constants.EVENT_TEST_FAIL;
var EVENT_TEST_END = constants.EVENT_TEST_END;
var EVENT_RUN_END = constants.EVENT_RUN_END;
var EVENT_TEST_PENDING = constants.EVENT_TEST_PENDING;

/**
 * Expose `JSON`.
 */

exports = module.exports = JSONReporter;

/**
 * Constructs a new `JSON` reporter instance.
 *
 * @public
 * @class JSON
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function JSONReporter(runner, options) {
  base.call(this, runner, options);

  var self = this;
  var tests = [];
  var pending = [];
  var failures = [];
  var passes = [];

  runner.on(EVENT_TEST_END, function(test) {
    tests.push(test);
  });

  runner.on(EVENT_TEST_PASS, function(test) {
    passes.push(test);
  });

  runner.on(EVENT_TEST_FAIL, function(test) {
    failures.push(test);
  });

  runner.on(EVENT_TEST_PENDING, function(test) {
    pending.push(test);
  });

  runner.once(EVENT_RUN_END, function() {
    var obj = {
      stats: self.stats,
      tests: tests.map(clean),
      pending: pending.map(clean),
      failures: failures.map(clean),
      passes: passes.map(clean)
    };

    runner.testResults = obj;

    process.stdout.write(JSON.stringify(obj, null, 2));
  });
}

/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @private
 * @param {Object} test
 * @return {Object}
 */
function clean(test) {
  var err = test.err || {};
  if (err instanceof Error) {
    err = errorJSON(err);
  }

  return {
    title: test.title,
    fullTitle: test.fullTitle(),
    file: test.file,
    duration: test.duration,
    currentRetry: test.currentRetry(),
    err: cleanCycles(err)
  };
}

/**
 * Replaces any circular references inside `obj` with '[object Object]'
 *
 * @private
 * @param {Object} obj
 * @return {Object}
 */
function cleanCycles(obj) {
  var cache = [];
  return JSON.parse(
    JSON.stringify(obj, function(key, value) {
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
          // Instead of going in a circle, we'll print [object Object]
          return '' + value;
        }
        cache.push(value);
      }

      return value;
    })
  );
}

/**
 * Transform an Error object into a JSON object.
 *
 * @private
 * @param {Error} err
 * @return {Object}
 */
function errorJSON(err) {
  var res = {};
  Object.getOwnPropertyNames(err).forEach(function(key) {
    res[key] = err[key];
  }, err);
  return res;
}

JSONReporter.description = 'single JSON object';
});

/**
 @module browser/Progress
*/

/**
 * Expose `Progress`.
 */

var progress = Progress;

/**
 * Initialize a new `Progress` indicator.
 */
function Progress() {
  this.percent = 0;
  this.size(0);
  this.fontSize(11);
  this.font('helvetica, arial, sans-serif');
}

/**
 * Set progress size to `size`.
 *
 * @public
 * @param {number} size
 * @return {Progress} Progress instance.
 */
Progress.prototype.size = function(size) {
  this._size = size;
  return this;
};

/**
 * Set text to `text`.
 *
 * @public
 * @param {string} text
 * @return {Progress} Progress instance.
 */
Progress.prototype.text = function(text) {
  this._text = text;
  return this;
};

/**
 * Set font size to `size`.
 *
 * @public
 * @param {number} size
 * @return {Progress} Progress instance.
 */
Progress.prototype.fontSize = function(size) {
  this._fontSize = size;
  return this;
};

/**
 * Set font to `family`.
 *
 * @param {string} family
 * @return {Progress} Progress instance.
 */
Progress.prototype.font = function(family) {
  this._font = family;
  return this;
};

/**
 * Update percentage to `n`.
 *
 * @param {number} n
 * @return {Progress} Progress instance.
 */
Progress.prototype.update = function(n) {
  this.percent = n;
  return this;
};

/**
 * Draw on `ctx`.
 *
 * @param {CanvasRenderingContext2d} ctx
 * @return {Progress} Progress instance.
 */
Progress.prototype.draw = function(ctx) {
  try {
    var percent = Math.min(this.percent, 100);
    var size = this._size;
    var half = size / 2;
    var x = half;
    var y = half;
    var rad = half - 1;
    var fontSize = this._fontSize;

    ctx.font = fontSize + 'px ' + this._font;

    var angle = Math.PI * 2 * (percent / 100);
    ctx.clearRect(0, 0, size, size);

    // outer circle
    ctx.strokeStyle = '#9f9f9f';
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, angle, false);
    ctx.stroke();

    // inner circle
    ctx.strokeStyle = '#eee';
    ctx.beginPath();
    ctx.arc(x, y, rad - 1, 0, angle, true);
    ctx.stroke();

    // text
    var text = this._text || (percent | 0) + '%';
    var w = ctx.measureText(text).width;

    ctx.fillText(text, x - w / 2 + 1, y + fontSize / 2 - 1);
  } catch (ignore) {
    // don't fail if we can't render progress
  }
  return this;
};

var html = createCommonjsModule(function (module, exports) {

/* eslint-env browser */
/**
 * @module HTML
 */
/**
 * Module dependencies.
 */





var constants = runner.constants;
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;
var EVENT_TEST_FAIL = constants.EVENT_TEST_FAIL;
var EVENT_SUITE_BEGIN = constants.EVENT_SUITE_BEGIN;
var EVENT_SUITE_END = constants.EVENT_SUITE_END;
var EVENT_TEST_PENDING = constants.EVENT_TEST_PENDING;
var escape = utils.escape;

/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */

var Date = commonjsGlobal.Date;

/**
 * Expose `HTML`.
 */

exports = module.exports = HTML;

/**
 * Stats template.
 */

var statsTemplate =
  '<ul id="mocha-stats">' +
  '<li class="progress"><canvas width="40" height="40"></canvas></li>' +
  '<li class="passes"><a href="javascript:void(0);">passes:</a> <em>0</em></li>' +
  '<li class="failures"><a href="javascript:void(0);">failures:</a> <em>0</em></li>' +
  '<li class="duration">duration: <em>0</em>s</li>' +
  '</ul>';

var playIcon = '&#x2023;';

/**
 * Constructs a new `HTML` reporter instance.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function HTML(runner, options) {
  base.call(this, runner, options);

  var self = this;
  var stats = this.stats;
  var stat = fragment(statsTemplate);
  var items = stat.getElementsByTagName('li');
  var passes = items[1].getElementsByTagName('em')[0];
  var passesLink = items[1].getElementsByTagName('a')[0];
  var failures = items[2].getElementsByTagName('em')[0];
  var failuresLink = items[2].getElementsByTagName('a')[0];
  var duration = items[3].getElementsByTagName('em')[0];
  var canvas = stat.getElementsByTagName('canvas')[0];
  var report = fragment('<ul id="mocha-report"></ul>');
  var stack = [report];
  var progress$1;
  var ctx;
  var root = document.getElementById('mocha');

  if (canvas.getContext) {
    var ratio = window.devicePixelRatio || 1;
    canvas.style.width = canvas.width;
    canvas.style.height = canvas.height;
    canvas.width *= ratio;
    canvas.height *= ratio;
    ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    progress$1 = new progress();
  }

  if (!root) {
    return error('#mocha div missing, add it to your document');
  }

  // pass toggle
  on(passesLink, 'click', function(evt) {
    evt.preventDefault();
    unhide();
    var name = /pass/.test(report.className) ? '' : ' pass';
    report.className = report.className.replace(/fail|pass/g, '') + name;
    if (report.className.trim()) {
      hideSuitesWithout('test pass');
    }
  });

  // failure toggle
  on(failuresLink, 'click', function(evt) {
    evt.preventDefault();
    unhide();
    var name = /fail/.test(report.className) ? '' : ' fail';
    report.className = report.className.replace(/fail|pass/g, '') + name;
    if (report.className.trim()) {
      hideSuitesWithout('test fail');
    }
  });

  root.appendChild(stat);
  root.appendChild(report);

  if (progress$1) {
    progress$1.size(40);
  }

  runner.on(EVENT_SUITE_BEGIN, function(suite) {
    if (suite.root) {
      return;
    }

    // suite
    var url = self.suiteURL(suite);
    var el = fragment(
      '<li class="suite"><h1><a href="%s">%s</a></h1></li>',
      url,
      escape(suite.title)
    );

    // container
    stack[0].appendChild(el);
    stack.unshift(document.createElement('ul'));
    el.appendChild(stack[0]);
  });

  runner.on(EVENT_SUITE_END, function(suite) {
    if (suite.root) {
      updateStats();
      return;
    }
    stack.shift();
  });

  runner.on(EVENT_TEST_PASS, function(test) {
    var url = self.testURL(test);
    var markup =
      '<li class="test pass %e"><h2>%e<span class="duration">%ems</span> ' +
      '<a href="%s" class="replay">' +
      playIcon +
      '</a></h2></li>';
    var el = fragment(markup, test.speed, test.title, test.duration, url);
    self.addCodeToggle(el, test.body);
    appendToStack(el);
    updateStats();
  });

  runner.on(EVENT_TEST_FAIL, function(test) {
    var el = fragment(
      '<li class="test fail"><h2>%e <a href="%e" class="replay">' +
        playIcon +
        '</a></h2></li>',
      test.title,
      self.testURL(test)
    );
    var stackString; // Note: Includes leading newline
    var message = test.err.toString();

    // <=IE7 stringifies to [Object Error]. Since it can be overloaded, we
    // check for the result of the stringifying.
    if (message === '[object Error]') {
      message = test.err.message;
    }

    if (test.err.stack) {
      var indexOfMessage = test.err.stack.indexOf(test.err.message);
      if (indexOfMessage === -1) {
        stackString = test.err.stack;
      } else {
        stackString = test.err.stack.substr(
          test.err.message.length + indexOfMessage
        );
      }
    } else if (test.err.sourceURL && test.err.line !== undefined) {
      // Safari doesn't give you a stack. Let's at least provide a source line.
      stackString = '\n(' + test.err.sourceURL + ':' + test.err.line + ')';
    }

    stackString = stackString || '';

    if (test.err.htmlMessage && stackString) {
      el.appendChild(
        fragment(
          '<div class="html-error">%s\n<pre class="error">%e</pre></div>',
          test.err.htmlMessage,
          stackString
        )
      );
    } else if (test.err.htmlMessage) {
      el.appendChild(
        fragment('<div class="html-error">%s</div>', test.err.htmlMessage)
      );
    } else {
      el.appendChild(
        fragment('<pre class="error">%e%e</pre>', message, stackString)
      );
    }

    self.addCodeToggle(el, test.body);
    appendToStack(el);
    updateStats();
  });

  runner.on(EVENT_TEST_PENDING, function(test) {
    var el = fragment(
      '<li class="test pass pending"><h2>%e</h2></li>',
      test.title
    );
    appendToStack(el);
    updateStats();
  });

  function appendToStack(el) {
    // Don't call .appendChild if #mocha-report was already .shift()'ed off the stack.
    if (stack[0]) {
      stack[0].appendChild(el);
    }
  }

  function updateStats() {
    // TODO: add to stats
    var percent = ((stats.tests / runner.total) * 100) | 0;
    if (progress$1) {
      progress$1.update(percent).draw(ctx);
    }

    // update stats
    var ms = new Date() - stats.start;
    text(passes, stats.passes);
    text(failures, stats.failures);
    text(duration, (ms / 1000).toFixed(2));
  }
}

/**
 * Makes a URL, preserving querystring ("search") parameters.
 *
 * @param {string} s
 * @return {string} A new URL.
 */
function makeUrl(s) {
  var search = window.location.search;

  // Remove previous grep query parameter if present
  if (search) {
    search = search.replace(/[?&]grep=[^&\s]*/g, '').replace(/^&/, '?');
  }

  return (
    window.location.pathname +
    (search ? search + '&' : '?') +
    'grep=' +
    encodeURIComponent(escapeStringRegexp(s))
  );
}

/**
 * Provide suite URL.
 *
 * @param {Object} [suite]
 */
HTML.prototype.suiteURL = function(suite) {
  return makeUrl(suite.fullTitle());
};

/**
 * Provide test URL.
 *
 * @param {Object} [test]
 */
HTML.prototype.testURL = function(test) {
  return makeUrl(test.fullTitle());
};

/**
 * Adds code toggle functionality for the provided test's list element.
 *
 * @param {HTMLLIElement} el
 * @param {string} contents
 */
HTML.prototype.addCodeToggle = function(el, contents) {
  var h2 = el.getElementsByTagName('h2')[0];

  on(h2, 'click', function() {
    pre.style.display = pre.style.display === 'none' ? 'block' : 'none';
  });

  var pre = fragment('<pre><code>%e</code></pre>', utils.clean(contents));
  el.appendChild(pre);
  pre.style.display = 'none';
};

/**
 * Display error `msg`.
 *
 * @param {string} msg
 */
function error(msg) {
  document.body.appendChild(fragment('<div id="mocha-error">%s</div>', msg));
}

/**
 * Return a DOM fragment from `html`.
 *
 * @param {string} html
 */
function fragment(html) {
  var args = arguments;
  var div = document.createElement('div');
  var i = 1;

  div.innerHTML = html.replace(/%([se])/g, function(_, type) {
    switch (type) {
      case 's':
        return String(args[i++]);
      case 'e':
        return escape(args[i++]);
      // no default
    }
  });

  return div.firstChild;
}

/**
 * Check for suites that do not have elements
 * with `classname`, and hide them.
 *
 * @param {text} classname
 */
function hideSuitesWithout(classname) {
  var suites = document.getElementsByClassName('suite');
  for (var i = 0; i < suites.length; i++) {
    var els = suites[i].getElementsByClassName(classname);
    if (!els.length) {
      suites[i].className += ' hidden';
    }
  }
}

/**
 * Unhide .hidden suites.
 */
function unhide() {
  var els = document.getElementsByClassName('suite hidden');
  while (els.length > 0) {
    els[0].className = els[0].className.replace('suite hidden', 'suite');
  }
}

/**
 * Set an element's text contents.
 *
 * @param {HTMLElement} el
 * @param {string} contents
 */
function text(el, contents) {
  if (el.textContent) {
    el.textContent = contents;
  } else {
    el.innerText = contents;
  }
}

/**
 * Listen on `event` with callback `fn`.
 */
function on(el, event, fn) {
  if (el.addEventListener) {
    el.addEventListener(event, fn, false);
  } else {
    el.attachEvent('on' + event, fn);
  }
}

HTML.browserOnly = true;
});

var list = createCommonjsModule(function (module, exports) {
/**
 * @module List
 */
/**
 * Module dependencies.
 */


var inherits = utils.inherits;
var constants = runner.constants;
var EVENT_RUN_BEGIN = constants.EVENT_RUN_BEGIN;
var EVENT_RUN_END = constants.EVENT_RUN_END;
var EVENT_TEST_BEGIN = constants.EVENT_TEST_BEGIN;
var EVENT_TEST_FAIL = constants.EVENT_TEST_FAIL;
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;
var EVENT_TEST_PENDING = constants.EVENT_TEST_PENDING;
var color = base.color;
var cursor = base.cursor;

/**
 * Expose `List`.
 */

exports = module.exports = List;

/**
 * Constructs a new `List` reporter instance.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function List(runner, options) {
  base.call(this, runner, options);

  var self = this;
  var n = 0;

  runner.on(EVENT_RUN_BEGIN, function() {
    base.consoleLog();
  });

  runner.on(EVENT_TEST_BEGIN, function(test) {
    process.stdout.write(color('pass', '    ' + test.fullTitle() + ': '));
  });

  runner.on(EVENT_TEST_PENDING, function(test) {
    var fmt = color('checkmark', '  -') + color('pending', ' %s');
    base.consoleLog(fmt, test.fullTitle());
  });

  runner.on(EVENT_TEST_PASS, function(test) {
    var fmt =
      color('checkmark', '  ' + base.symbols.ok) +
      color('pass', ' %s: ') +
      color(test.speed, '%dms');
    cursor.CR();
    base.consoleLog(fmt, test.fullTitle(), test.duration);
  });

  runner.on(EVENT_TEST_FAIL, function(test) {
    cursor.CR();
    base.consoleLog(color('fail', '  %d) %s'), ++n, test.fullTitle());
  });

  runner.once(EVENT_RUN_END, self.epilogue.bind(self));
}

/**
 * Inherit from `Base.prototype`.
 */
inherits(List, base);

List.description = 'like "spec" reporter but flat';
});

var min = createCommonjsModule(function (module, exports) {
/**
 * @module Min
 */
/**
 * Module dependencies.
 */


var inherits = utils.inherits;
var constants = runner.constants;
var EVENT_RUN_END = constants.EVENT_RUN_END;
var EVENT_RUN_BEGIN = constants.EVENT_RUN_BEGIN;

/**
 * Expose `Min`.
 */

exports = module.exports = Min;

/**
 * Constructs a new `Min` reporter instance.
 *
 * @description
 * This minimal test reporter is best used with '--watch'.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function Min(runner, options) {
  base.call(this, runner, options);

  runner.on(EVENT_RUN_BEGIN, function() {
    // clear screen
    process.stdout.write('\u001b[2J');
    // set cursor position
    process.stdout.write('\u001b[1;3H');
  });

  runner.once(EVENT_RUN_END, this.epilogue.bind(this));
}

/**
 * Inherit from `Base.prototype`.
 */
inherits(Min, base);

Min.description = 'essentially just a summary';
});

var spec = createCommonjsModule(function (module, exports) {
/**
 * @module Spec
 */
/**
 * Module dependencies.
 */


var constants = runner.constants;
var EVENT_RUN_BEGIN = constants.EVENT_RUN_BEGIN;
var EVENT_RUN_END = constants.EVENT_RUN_END;
var EVENT_SUITE_BEGIN = constants.EVENT_SUITE_BEGIN;
var EVENT_SUITE_END = constants.EVENT_SUITE_END;
var EVENT_TEST_FAIL = constants.EVENT_TEST_FAIL;
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;
var EVENT_TEST_PENDING = constants.EVENT_TEST_PENDING;
var inherits = utils.inherits;
var color = base.color;

/**
 * Expose `Spec`.
 */

exports = module.exports = Spec;

/**
 * Constructs a new `Spec` reporter instance.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function Spec(runner, options) {
  base.call(this, runner, options);

  var self = this;
  var indents = 0;
  var n = 0;

  function indent() {
    return Array(indents).join('  ');
  }

  runner.on(EVENT_RUN_BEGIN, function() {
    base.consoleLog();
  });

  runner.on(EVENT_SUITE_BEGIN, function(suite) {
    ++indents;
    base.consoleLog(color('suite', '%s%s'), indent(), suite.title);
  });

  runner.on(EVENT_SUITE_END, function() {
    --indents;
    if (indents === 1) {
      base.consoleLog();
    }
  });

  runner.on(EVENT_TEST_PENDING, function(test) {
    var fmt = indent() + color('pending', '  - %s');
    base.consoleLog(fmt, test.title);
  });

  runner.on(EVENT_TEST_PASS, function(test) {
    var fmt;
    if (test.speed === 'fast') {
      fmt =
        indent() +
        color('checkmark', '  ' + base.symbols.ok) +
        color('pass', ' %s');
      base.consoleLog(fmt, test.title);
    } else {
      fmt =
        indent() +
        color('checkmark', '  ' + base.symbols.ok) +
        color('pass', ' %s') +
        color(test.speed, ' (%dms)');
      base.consoleLog(fmt, test.title, test.duration);
    }
  });

  runner.on(EVENT_TEST_FAIL, function(test) {
    base.consoleLog(indent() + color('fail', '  %d) %s'), ++n, test.title);
  });

  runner.once(EVENT_RUN_END, self.epilogue.bind(self));
}

/**
 * Inherit from `Base.prototype`.
 */
inherits(Spec, base);

Spec.description = 'hierarchical & verbose [default]';
});

var nyan = createCommonjsModule(function (module, exports) {
/**
 * @module Nyan
 */
/**
 * Module dependencies.
 */


var constants = runner.constants;
var inherits = utils.inherits;
var EVENT_RUN_BEGIN = constants.EVENT_RUN_BEGIN;
var EVENT_TEST_PENDING = constants.EVENT_TEST_PENDING;
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;
var EVENT_RUN_END = constants.EVENT_RUN_END;
var EVENT_TEST_FAIL = constants.EVENT_TEST_FAIL;

/**
 * Expose `Dot`.
 */

exports = module.exports = NyanCat;

/**
 * Constructs a new `Nyan` reporter instance.
 *
 * @public
 * @class Nyan
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function NyanCat(runner, options) {
  base.call(this, runner, options);

  var self = this;
  var width = (base.window.width * 0.75) | 0;
  var nyanCatWidth = (this.nyanCatWidth = 11);

  this.colorIndex = 0;
  this.numberOfLines = 4;
  this.rainbowColors = self.generateColors();
  this.scoreboardWidth = 5;
  this.tick = 0;
  this.trajectories = [[], [], [], []];
  this.trajectoryWidthMax = width - nyanCatWidth;

  runner.on(EVENT_RUN_BEGIN, function() {
    base.cursor.hide();
    self.draw();
  });

  runner.on(EVENT_TEST_PENDING, function() {
    self.draw();
  });

  runner.on(EVENT_TEST_PASS, function() {
    self.draw();
  });

  runner.on(EVENT_TEST_FAIL, function() {
    self.draw();
  });

  runner.once(EVENT_RUN_END, function() {
    base.cursor.show();
    for (var i = 0; i < self.numberOfLines; i++) {
      write('\n');
    }
    self.epilogue();
  });
}

/**
 * Inherit from `Base.prototype`.
 */
inherits(NyanCat, base);

/**
 * Draw the nyan cat
 *
 * @private
 */

NyanCat.prototype.draw = function() {
  this.appendRainbow();
  this.drawScoreboard();
  this.drawRainbow();
  this.drawNyanCat();
  this.tick = !this.tick;
};

/**
 * Draw the "scoreboard" showing the number
 * of passes, failures and pending tests.
 *
 * @private
 */

NyanCat.prototype.drawScoreboard = function() {
  var stats = this.stats;

  function draw(type, n) {
    write(' ');
    write(base.color(type, n));
    write('\n');
  }

  draw('green', stats.passes);
  draw('fail', stats.failures);
  draw('pending', stats.pending);
  write('\n');

  this.cursorUp(this.numberOfLines);
};

/**
 * Append the rainbow.
 *
 * @private
 */

NyanCat.prototype.appendRainbow = function() {
  var segment = this.tick ? '_' : '-';
  var rainbowified = this.rainbowify(segment);

  for (var index = 0; index < this.numberOfLines; index++) {
    var trajectory = this.trajectories[index];
    if (trajectory.length >= this.trajectoryWidthMax) {
      trajectory.shift();
    }
    trajectory.push(rainbowified);
  }
};

/**
 * Draw the rainbow.
 *
 * @private
 */

NyanCat.prototype.drawRainbow = function() {
  var self = this;

  this.trajectories.forEach(function(line) {
    write('\u001b[' + self.scoreboardWidth + 'C');
    write(line.join(''));
    write('\n');
  });

  this.cursorUp(this.numberOfLines);
};

/**
 * Draw the nyan cat
 *
 * @private
 */
NyanCat.prototype.drawNyanCat = function() {
  var self = this;
  var startWidth = this.scoreboardWidth + this.trajectories[0].length;
  var dist = '\u001b[' + startWidth + 'C';
  var padding = '';

  write(dist);
  write('_,------,');
  write('\n');

  write(dist);
  padding = self.tick ? '  ' : '   ';
  write('_|' + padding + '/\\_/\\ ');
  write('\n');

  write(dist);
  padding = self.tick ? '_' : '__';
  var tail = self.tick ? '~' : '^';
  write(tail + '|' + padding + this.face() + ' ');
  write('\n');

  write(dist);
  padding = self.tick ? ' ' : '  ';
  write(padding + '""  "" ');
  write('\n');

  this.cursorUp(this.numberOfLines);
};

/**
 * Draw nyan cat face.
 *
 * @private
 * @return {string}
 */

NyanCat.prototype.face = function() {
  var stats = this.stats;
  if (stats.failures) {
    return '( x .x)';
  } else if (stats.pending) {
    return '( o .o)';
  } else if (stats.passes) {
    return '( ^ .^)';
  }
  return '( - .-)';
};

/**
 * Move cursor up `n`.
 *
 * @private
 * @param {number} n
 */

NyanCat.prototype.cursorUp = function(n) {
  write('\u001b[' + n + 'A');
};

/**
 * Move cursor down `n`.
 *
 * @private
 * @param {number} n
 */

NyanCat.prototype.cursorDown = function(n) {
  write('\u001b[' + n + 'B');
};

/**
 * Generate rainbow colors.
 *
 * @private
 * @return {Array}
 */
NyanCat.prototype.generateColors = function() {
  var colors = [];

  for (var i = 0; i < 6 * 7; i++) {
    var pi3 = Math.floor(Math.PI / 3);
    var n = i * (1.0 / 6);
    var r = Math.floor(3 * Math.sin(n) + 3);
    var g = Math.floor(3 * Math.sin(n + 2 * pi3) + 3);
    var b = Math.floor(3 * Math.sin(n + 4 * pi3) + 3);
    colors.push(36 * r + 6 * g + b + 16);
  }

  return colors;
};

/**
 * Apply rainbow to the given `str`.
 *
 * @private
 * @param {string} str
 * @return {string}
 */
NyanCat.prototype.rainbowify = function(str) {
  if (!base.useColors) {
    return str;
  }
  var color = this.rainbowColors[this.colorIndex % this.rainbowColors.length];
  this.colorIndex += 1;
  return '\u001b[38;5;' + color + 'm' + str + '\u001b[0m';
};

/**
 * Stdout helper.
 *
 * @param {string} string A message to write to stdout.
 */
function write(string) {
  process.stdout.write(string);
}

NyanCat.description = '"nyan cat"';
});

var xunit = createCommonjsModule(function (module, exports) {
/**
 * @module XUnit
 */
/**
 * Module dependencies.
 */






var createUnsupportedError = errors.createUnsupportedError;
var constants = runner.constants;
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;
var EVENT_TEST_FAIL = constants.EVENT_TEST_FAIL;
var EVENT_RUN_END = constants.EVENT_RUN_END;
var EVENT_TEST_PENDING = constants.EVENT_TEST_PENDING;
var STATE_FAILED = runnable.constants.STATE_FAILED;
var inherits = utils.inherits;
var escape = utils.escape;

/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */
var Date = commonjsGlobal.Date;

/**
 * Expose `XUnit`.
 */

exports = module.exports = XUnit;

/**
 * Constructs a new `XUnit` reporter instance.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function XUnit(runner, options) {
  base.call(this, runner, options);

  var stats = this.stats;
  var tests = [];
  var self = this;

  // the name of the test suite, as it will appear in the resulting XML file
  var suiteName;

  // the default name of the test suite if none is provided
  var DEFAULT_SUITE_NAME = 'Mocha Tests';

  if (options && options.reporterOptions) {
    if (options.reporterOptions.output) {
      if (!fs.createWriteStream) {
        throw createUnsupportedError('file output not supported in browser');
      }

      fs.mkdirSync(path.dirname(options.reporterOptions.output), {
        recursive: true
      });
      self.fileStream = fs.createWriteStream(options.reporterOptions.output);
    }

    // get the suite name from the reporter options (if provided)
    suiteName = options.reporterOptions.suiteName;
  }

  // fall back to the default suite name
  suiteName = suiteName || DEFAULT_SUITE_NAME;

  runner.on(EVENT_TEST_PENDING, function(test) {
    tests.push(test);
  });

  runner.on(EVENT_TEST_PASS, function(test) {
    tests.push(test);
  });

  runner.on(EVENT_TEST_FAIL, function(test) {
    tests.push(test);
  });

  runner.once(EVENT_RUN_END, function() {
    self.write(
      tag(
        'testsuite',
        {
          name: suiteName,
          tests: stats.tests,
          failures: 0,
          errors: stats.failures,
          skipped: stats.tests - stats.failures - stats.passes,
          timestamp: new Date().toUTCString(),
          time: stats.duration / 1000 || 0
        },
        false
      )
    );

    tests.forEach(function(t) {
      self.test(t);
    });

    self.write('</testsuite>');
  });
}

/**
 * Inherit from `Base.prototype`.
 */
inherits(XUnit, base);

/**
 * Override done to close the stream (if it's a file).
 *
 * @param failures
 * @param {Function} fn
 */
XUnit.prototype.done = function(failures, fn) {
  if (this.fileStream) {
    this.fileStream.end(function() {
      fn(failures);
    });
  } else {
    fn(failures);
  }
};

/**
 * Write out the given line.
 *
 * @param {string} line
 */
XUnit.prototype.write = function(line) {
  if (this.fileStream) {
    this.fileStream.write(line + '\n');
  } else if (typeof process === 'object' && process.stdout) {
    process.stdout.write(line + '\n');
  } else {
    base.consoleLog(line);
  }
};

/**
 * Output tag for the given `test.`
 *
 * @param {Test} test
 */
XUnit.prototype.test = function(test) {
  base.useColors = false;

  var attrs = {
    classname: test.parent.fullTitle(),
    name: test.title,
    time: test.duration / 1000 || 0
  };

  if (test.state === STATE_FAILED) {
    var err = test.err;
    var diff =
      !base.hideDiff && base.showDiff(err)
        ? '\n' + base.generateDiff(err.actual, err.expected)
        : '';
    this.write(
      tag(
        'testcase',
        attrs,
        false,
        tag(
          'failure',
          {},
          false,
          escape(err.message) + escape(diff) + '\n' + escape(err.stack)
        )
      )
    );
  } else if (test.isPending()) {
    this.write(tag('testcase', attrs, false, tag('skipped', {}, true)));
  } else {
    this.write(tag('testcase', attrs, true));
  }
};

/**
 * HTML tag helper.
 *
 * @param name
 * @param attrs
 * @param close
 * @param content
 * @return {string}
 */
function tag(name, attrs, close, content) {
  var end = close ? '/>' : '>';
  var pairs = [];
  var tag;

  for (var key in attrs) {
    if (Object.prototype.hasOwnProperty.call(attrs, key)) {
      pairs.push(key + '="' + escape(attrs[key]) + '"');
    }
  }

  tag = '<' + name + (pairs.length ? ' ' + pairs.join(' ') : '') + end;
  if (content) {
    tag += content + '</' + name + end;
  }
  return tag;
}

XUnit.description = 'XUnit-compatible XML output';
});

var markdown = createCommonjsModule(function (module, exports) {
/**
 * @module Markdown
 */
/**
 * Module dependencies.
 */



var constants = runner.constants;
var EVENT_RUN_END = constants.EVENT_RUN_END;
var EVENT_SUITE_BEGIN = constants.EVENT_SUITE_BEGIN;
var EVENT_SUITE_END = constants.EVENT_SUITE_END;
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;

/**
 * Constants
 */

var SUITE_PREFIX = '$';

/**
 * Expose `Markdown`.
 */

exports = module.exports = Markdown;

/**
 * Constructs a new `Markdown` reporter instance.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function Markdown(runner, options) {
  base.call(this, runner, options);

  var level = 0;
  var buf = '';

  function title(str) {
    return Array(level).join('#') + ' ' + str;
  }

  function mapTOC(suite, obj) {
    var ret = obj;
    var key = SUITE_PREFIX + suite.title;

    obj = obj[key] = obj[key] || {suite: suite};
    suite.suites.forEach(function(suite) {
      mapTOC(suite, obj);
    });

    return ret;
  }

  function stringifyTOC(obj, level) {
    ++level;
    var buf = '';
    var link;
    for (var key in obj) {
      if (key === 'suite') {
        continue;
      }
      if (key !== SUITE_PREFIX) {
        link = ' - [' + key.substring(1) + ']';
        link += '(#' + utils.slug(obj[key].suite.fullTitle()) + ')\n';
        buf += Array(level).join('  ') + link;
      }
      buf += stringifyTOC(obj[key], level);
    }
    return buf;
  }

  function generateTOC(suite) {
    var obj = mapTOC(suite, {});
    return stringifyTOC(obj, 0);
  }

  generateTOC(runner.suite);

  runner.on(EVENT_SUITE_BEGIN, function(suite) {
    ++level;
    var slug = utils.slug(suite.fullTitle());
    buf += '<a name="' + slug + '"></a>' + '\n';
    buf += title(suite.title) + '\n';
  });

  runner.on(EVENT_SUITE_END, function() {
    --level;
  });

  runner.on(EVENT_TEST_PASS, function(test) {
    var code = utils.clean(test.body);
    buf += test.title + '.\n';
    buf += '\n```js\n';
    buf += code + '\n';
    buf += '```\n\n';
  });

  runner.once(EVENT_RUN_END, function() {
    process.stdout.write('# TOC\n');
    process.stdout.write(generateTOC(runner.suite));
    process.stdout.write(buf);
  });
}

Markdown.description = 'GitHub Flavored Markdown';
});

var progress$1 = createCommonjsModule(function (module, exports) {
/**
 * @module Progress
 */
/**
 * Module dependencies.
 */


var constants = runner.constants;
var EVENT_RUN_BEGIN = constants.EVENT_RUN_BEGIN;
var EVENT_TEST_END = constants.EVENT_TEST_END;
var EVENT_RUN_END = constants.EVENT_RUN_END;
var inherits = utils.inherits;
var color = base.color;
var cursor = base.cursor;

/**
 * Expose `Progress`.
 */

exports = module.exports = Progress;

/**
 * General progress bar color.
 */

base.colors.progress = 90;

/**
 * Constructs a new `Progress` reporter instance.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function Progress(runner, options) {
  base.call(this, runner, options);

  var self = this;
  var width = (base.window.width * 0.5) | 0;
  var total = runner.total;
  var complete = 0;
  var lastN = -1;

  // default chars
  options = options || {};
  var reporterOptions = options.reporterOptions || {};

  options.open = reporterOptions.open || '[';
  options.complete = reporterOptions.complete || '▬';
  options.incomplete = reporterOptions.incomplete || base.symbols.dot;
  options.close = reporterOptions.close || ']';
  options.verbose = reporterOptions.verbose || false;

  // tests started
  runner.on(EVENT_RUN_BEGIN, function() {
    process.stdout.write('\n');
    cursor.hide();
  });

  // tests complete
  runner.on(EVENT_TEST_END, function() {
    complete++;

    var percent = complete / total;
    var n = (width * percent) | 0;
    var i = width - n;

    if (n === lastN && !options.verbose) {
      // Don't re-render the line if it hasn't changed
      return;
    }
    lastN = n;

    cursor.CR();
    process.stdout.write('\u001b[J');
    process.stdout.write(color('progress', '  ' + options.open));
    process.stdout.write(Array(n).join(options.complete));
    process.stdout.write(Array(i).join(options.incomplete));
    process.stdout.write(color('progress', options.close));
    if (options.verbose) {
      process.stdout.write(color('progress', ' ' + complete + ' of ' + total));
    }
  });

  // tests are complete, output some stats
  // and the failures if any
  runner.once(EVENT_RUN_END, function() {
    cursor.show();
    process.stdout.write('\n');
    self.epilogue();
  });
}

/**
 * Inherit from `Base.prototype`.
 */
inherits(Progress, base);

Progress.description = 'a progress bar';
});

var landing = createCommonjsModule(function (module, exports) {
/**
 * @module Landing
 */
/**
 * Module dependencies.
 */


var inherits = utils.inherits;
var constants = runner.constants;
var EVENT_RUN_BEGIN = constants.EVENT_RUN_BEGIN;
var EVENT_RUN_END = constants.EVENT_RUN_END;
var EVENT_TEST_END = constants.EVENT_TEST_END;
var STATE_FAILED = runnable.constants.STATE_FAILED;

var cursor = base.cursor;
var color = base.color;

/**
 * Expose `Landing`.
 */

exports = module.exports = Landing;

/**
 * Airplane color.
 */

base.colors.plane = 0;

/**
 * Airplane crash color.
 */

base.colors['plane crash'] = 31;

/**
 * Runway color.
 */

base.colors.runway = 90;

/**
 * Constructs a new `Landing` reporter instance.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function Landing(runner, options) {
  base.call(this, runner, options);

  var self = this;
  var width = (base.window.width * 0.75) | 0;
  var stream = process.stdout;

  var plane = color('plane', '✈');
  var crashed = -1;
  var n = 0;
  var total = 0;

  function runway() {
    var buf = Array(width).join('-');
    return '  ' + color('runway', buf);
  }

  runner.on(EVENT_RUN_BEGIN, function() {
    stream.write('\n\n\n  ');
    cursor.hide();
  });

  runner.on(EVENT_TEST_END, function(test) {
    // check if the plane crashed
    var col = crashed === -1 ? ((width * ++n) / ++total) | 0 : crashed;
    // show the crash
    if (test.state === STATE_FAILED) {
      plane = color('plane crash', '✈');
      crashed = col;
    }

    // render landing strip
    stream.write('\u001b[' + (width + 1) + 'D\u001b[2A');
    stream.write(runway());
    stream.write('\n  ');
    stream.write(color('runway', Array(col).join('⋅')));
    stream.write(plane);
    stream.write(color('runway', Array(width - col).join('⋅') + '\n'));
    stream.write(runway());
    stream.write('\u001b[0m');
  });

  runner.once(EVENT_RUN_END, function() {
    cursor.show();
    process.stdout.write('\n');
    self.epilogue();
  });

  // if cursor is hidden when we ctrl-C, then it will remain hidden unless...
  process.once('SIGINT', function() {
    cursor.show();
    process.nextTick(function() {
      process.kill(process.pid, 'SIGINT');
    });
  });
}

/**
 * Inherit from `Base.prototype`.
 */
inherits(Landing, base);

Landing.description = 'Unicode landing strip';
});

var jsonStream = createCommonjsModule(function (module, exports) {
/**
 * @module JSONStream
 */
/**
 * Module dependencies.
 */


var constants = runner.constants;
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;
var EVENT_TEST_FAIL = constants.EVENT_TEST_FAIL;
var EVENT_RUN_BEGIN = constants.EVENT_RUN_BEGIN;
var EVENT_RUN_END = constants.EVENT_RUN_END;

/**
 * Expose `JSONStream`.
 */

exports = module.exports = JSONStream;

/**
 * Constructs a new `JSONStream` reporter instance.
 *
 * @public
 * @class
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function JSONStream(runner, options) {
  base.call(this, runner, options);

  var self = this;
  var total = runner.total;

  runner.once(EVENT_RUN_BEGIN, function() {
    writeEvent(['start', {total: total}]);
  });

  runner.on(EVENT_TEST_PASS, function(test) {
    writeEvent(['pass', clean(test)]);
  });

  runner.on(EVENT_TEST_FAIL, function(test, err) {
    test = clean(test);
    test.err = err.message;
    test.stack = err.stack || null;
    writeEvent(['fail', test]);
  });

  runner.once(EVENT_RUN_END, function() {
    writeEvent(['end', self.stats]);
  });
}

/**
 * Mocha event to be written to the output stream.
 * @typedef {Array} JSONStream~MochaEvent
 */

/**
 * Writes Mocha event to reporter output stream.
 *
 * @private
 * @param {JSONStream~MochaEvent} event - Mocha event to be output.
 */
function writeEvent(event) {
  process.stdout.write(JSON.stringify(event) + '\n');
}

/**
 * Returns an object literal representation of `test`
 * free of cyclic properties, etc.
 *
 * @private
 * @param {Test} test - Instance used as data source.
 * @return {Object} object containing pared-down test instance data
 */
function clean(test) {
  return {
    title: test.title,
    fullTitle: test.fullTitle(),
    file: test.file,
    duration: test.duration,
    currentRetry: test.currentRetry()
  };
}

JSONStream.description = 'newline delimited JSON events';
});

var reporters = createCommonjsModule(function (module, exports) {

// Alias exports to a their normalized format Mocha#reporter to prevent a need
// for dynamic (try/catch) requires, which Browserify doesn't handle.
exports.Base = exports.base = base;
exports.Dot = exports.dot = dot;
exports.Doc = exports.doc = doc;
exports.TAP = exports.tap = tap;
exports.JSON = exports.json = json;
exports.HTML = exports.html = html;
exports.List = exports.list = list;
exports.Min = exports.min = min;
exports.Spec = exports.spec = spec;
exports.Nyan = exports.nyan = nyan;
exports.XUnit = exports.xunit = xunit;
exports.Markdown = exports.markdown = markdown;
exports.Progress = exports.progress = progress$1;
exports.Landing = exports.landing = landing;
exports.JSONStream = exports['json-stream'] = jsonStream;
});

var windows = isexe;
isexe.sync = sync;



function checkPathExt (path, options) {
  var pathext = options.pathExt !== undefined ?
    options.pathExt : process.env.PATHEXT;

  if (!pathext) {
    return true
  }

  pathext = pathext.split(';');
  if (pathext.indexOf('') !== -1) {
    return true
  }
  for (var i = 0; i < pathext.length; i++) {
    var p = pathext[i].toLowerCase();
    if (p && path.substr(-p.length).toLowerCase() === p) {
      return true
    }
  }
  return false
}

function checkStat (stat, path, options) {
  if (!stat.isSymbolicLink() && !stat.isFile()) {
    return false
  }
  return checkPathExt(path, options)
}

function isexe (path, options, cb) {
  fs.stat(path, function (er, stat) {
    cb(er, er ? false : checkStat(stat, path, options));
  });
}

function sync (path, options) {
  return checkStat(fs.statSync(path), path, options)
}

var mode = isexe$1;
isexe$1.sync = sync$1;



function isexe$1 (path, options, cb) {
  fs.stat(path, function (er, stat) {
    cb(er, er ? false : checkStat$1(stat, options));
  });
}

function sync$1 (path, options) {
  return checkStat$1(fs.statSync(path), options)
}

function checkStat$1 (stat, options) {
  return stat.isFile() && checkMode(stat, options)
}

function checkMode (stat, options) {
  var mod = stat.mode;
  var uid = stat.uid;
  var gid = stat.gid;

  var myUid = options.uid !== undefined ?
    options.uid : process.getuid && process.getuid();
  var myGid = options.gid !== undefined ?
    options.gid : process.getgid && process.getgid();

  var u = parseInt('100', 8);
  var g = parseInt('010', 8);
  var o = parseInt('001', 8);
  var ug = u | g;

  var ret = (mod & o) ||
    (mod & g) && gid === myGid ||
    (mod & u) && uid === myUid ||
    (mod & ug) && myUid === 0;

  return ret
}

var core;
if (process.platform === 'win32' || commonjsGlobal.TESTING_WINDOWS) {
  core = windows;
} else {
  core = mode;
}

var isexe_1 = isexe$2;
isexe$2.sync = sync$2;

function isexe$2 (path, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  if (!cb) {
    if (typeof Promise !== 'function') {
      throw new TypeError('callback not provided')
    }

    return new Promise(function (resolve, reject) {
      isexe$2(path, options || {}, function (er, is) {
        if (er) {
          reject(er);
        } else {
          resolve(is);
        }
      });
    })
  }

  core(path, options || {}, function (er, is) {
    // ignore EACCES because that just means we aren't allowed to run it
    if (er) {
      if (er.code === 'EACCES' || options && options.ignoreErrors) {
        er = null;
        is = false;
      }
    }
    cb(er, is);
  });
}

function sync$2 (path, options) {
  // my kingdom for a filtered catch
  try {
    return core.sync(path, options || {})
  } catch (er) {
    if (options && options.ignoreErrors || er.code === 'EACCES') {
      return false
    } else {
      throw er
    }
  }
}

const isWindows = process.platform === 'win32' ||
    process.env.OSTYPE === 'cygwin' ||
    process.env.OSTYPE === 'msys';


const COLON = isWindows ? ';' : ':';


const getNotFoundError = (cmd) =>
  Object.assign(new Error(`not found: ${cmd}`), { code: 'ENOENT' });

const getPathInfo = (cmd, opt) => {
  const colon = opt.colon || COLON;

  // If it has a slash, then we don't bother searching the pathenv.
  // just check the file itself, and that's it.
  const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? ['']
    : (
      [
        // windows always checks the cwd first
        ...(isWindows ? [process.cwd()] : []),
        ...(opt.path || process.env.PATH ||
          /* istanbul ignore next: very unusual */ '').split(colon),
      ]
    );
  const pathExtExe = isWindows
    ? opt.pathExt || process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM'
    : '';
  const pathExt = isWindows ? pathExtExe.split(colon) : [''];

  if (isWindows) {
    if (cmd.indexOf('.') !== -1 && pathExt[0] !== '')
      pathExt.unshift('');
  }

  return {
    pathEnv,
    pathExt,
    pathExtExe,
  }
};

const which = (cmd, opt, cb) => {
  if (typeof opt === 'function') {
    cb = opt;
    opt = {};
  }
  if (!opt)
    opt = {};

  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
  const found = [];

  const step = i => new Promise((resolve, reject) => {
    if (i === pathEnv.length)
      return opt.all && found.length ? resolve(found)
        : reject(getNotFoundError(cmd))

    const ppRaw = pathEnv[i];
    const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;

    const pCmd = path.join(pathPart, cmd);
    const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd
      : pCmd;

    resolve(subStep(p, i, 0));
  });

  const subStep = (p, i, ii) => new Promise((resolve, reject) => {
    if (ii === pathExt.length)
      return resolve(step(i + 1))
    const ext = pathExt[ii];
    isexe_1(p + ext, { pathExt: pathExtExe }, (er, is) => {
      if (!er && is) {
        if (opt.all)
          found.push(p + ext);
        else
          return resolve(p + ext)
      }
      return resolve(subStep(p, i, ii + 1))
    });
  });

  return cb ? step(0).then(res => cb(null, res), cb) : step(0)
};

const whichSync = (cmd, opt) => {
  opt = opt || {};

  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
  const found = [];

  for (let i = 0; i < pathEnv.length; i ++) {
    const ppRaw = pathEnv[i];
    const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;

    const pCmd = path.join(pathPart, cmd);
    const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd
      : pCmd;

    for (let j = 0; j < pathExt.length; j ++) {
      const cur = p + pathExt[j];
      try {
        const is = isexe_1.sync(cur, { pathExt: pathExtExe });
        if (is) {
          if (opt.all)
            found.push(cur);
          else
            return cur
        }
      } catch (ex) {}
    }
  }

  if (opt.all && found.length)
    return found

  if (opt.nothrow)
    return null

  throw getNotFoundError(cmd)
};

var which_1 = which;
which.sync = whichSync;

// Growl - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)

/**
 * Module dependencies.
 */

const spawn = child_process.spawn;




const exists = fs.existsSync || path.existsSync;
let cmd;

function which$1(name) {
  const paths = process.env.PATH.split(':');
  let loc;

  for (let i = 0, len = paths.length; i < len; i += 1) {
    loc = path.join(paths[i], name);
    if (exists(loc)) return loc;
  }
  return false;
}

function setupCmd() {
  switch (os.type()) {
    case 'Darwin':
      if (which$1('terminal-notifier')) {
        cmd = {
          type: 'Darwin-NotificationCenter',
          pkg: 'terminal-notifier',
          msg: '-message',
          title: '-title',
          subtitle: '-subtitle',
          icon: '-appIcon',
          sound: '-sound',
          url: '-open',
          priority: {
            cmd: '-execute',
            range: [],
          },
        };
      } else {
        cmd = {
          type: 'Darwin-Growl',
          pkg: 'growlnotify',
          msg: '-m',
          sticky: '--sticky',
          url: '--url',
          priority: {
            cmd: '--priority',
            range: [
              -2,
              -1,
              0,
              1,
              2,
              'Very Low',
              'Moderate',
              'Normal',
              'High',
              'Emergency',
            ],
          },
        };
      }
      break;
    case 'Linux':
      if (which$1('growl')) {
        cmd = {
          type: 'Linux-Growl',
          pkg: 'growl',
          msg: '-m',
          title: '-title',
          subtitle: '-subtitle',
          host: {
            cmd: '-H',
            hostname: '192.168.33.1',
          },
        };
      } else {
        cmd = {
          type: 'Linux',
          pkg: 'notify-send',
          msg: '',
          sticky: '-t',
          icon: '-i',
          priority: {
            cmd: '-u',
            range: [
              'low',
              'normal',
              'critical',
            ],
          },
        };
      }
      break;
    case 'Windows_NT':
      cmd = {
        type: 'Windows',
        pkg: 'growlnotify',
        msg: '',
        sticky: '/s:true',
        title: '/t:',
        icon: '/i:',
        url: '/cu:',
        priority: {
          cmd: '/p:',
          range: [
            -2,
            -1,
            0,
            1,
            2,
          ],
        },
      };
      break;
  }
}


/**
 * Send growl notification _msg_ with _options_.
 *
 * Options:
 *
 *  - title   Notification title
 *  - sticky  Make the notification stick (defaults to false)
 *  - priority  Specify an int or named key (default is 0)
 *  - name    Application name (defaults to growlnotify)
 *  - sound   Sound efect ( in OSx defined in preferences -> sound -> effects)
 *            works only in OSX > 10.8x
 *  - image
 *    - path to an icon sets --iconpath
 *    - path to an image sets --image
 *    - capitalized word sets --appIcon
 *    - filename uses extname as --icon
 *    - otherwise treated as --icon
 *
 * Examples:
 *
 *   growl('New email')
 *   growl('5 new emails', { title: 'Thunderbird' })
 *   growl('5 new emails', { title: 'Thunderbird', sound: 'Purr' })
 *   growl('Email sent', function(){
 *     // ... notification sent
 *   })
 *
 * @param {string} msg
 * @param {object} opts
 * @param {function} callback
 * @api public
 */

function growl(msg, opts, callback) {
  let image;
  const options = opts || {};
  const fn = callback || function noop() {};

  setupCmd();

  if (options.exec) {
    cmd = {
      type: 'Custom',
      pkg: options.exec,
      range: [],
    };
  }

  // noop
  if (!cmd) {
    fn(new Error('growl not supported on this platform'));
    return;
  }
  const args = [cmd.pkg];

  // image
  if (image || options.image) {
    image = options.image;
    switch (cmd.type) {
      case 'Darwin-Growl': {
        let flag;
        const ext = path.extname(image).substr(1);
        flag = ext === 'icns' && 'iconpath';
        flag = flag || (/^[A-Z]/.test(image) && 'appIcon');
        flag = flag || (/^png|gif|jpe?g$/.test(ext) && 'image');
        flag = flag || (ext && (image = ext) && 'icon');
        flag = flag || 'icon';
        args.push(`--${flag}`, image);
        break;
      }
      case 'Darwin-NotificationCenter':
        args.push(cmd.icon, image);
        break;
      case 'Linux':
        args.push(cmd.icon, image);
        // libnotify defaults to sticky, set a hint for transient notifications
        if (!options.sticky) args.push('--hint=int:transient:1');
        break;
      case 'Windows':
        args.push(cmd.icon + image);
        break;
    }
  }

  // sticky
  if (options.sticky) args.push(cmd.sticky);
  if (options.sticky && cmd.type === 'Linux') args.push('0');

  // priority
  if (options.priority) {
    const priority = `${options.priority}`;
    const checkindexOf = cmd.priority.range.indexOf(priority);
    if (checkindexOf > -1) {
      args.push(cmd.priority, options.priority);
    }
  }

  // sound
  if (options.sound && cmd.type === 'Darwin-NotificationCenter') {
    args.push(cmd.sound, options.sound);
  }

  // name
  if (options.name && cmd.type === 'Darwin-Growl') {
    args.push('--name', options.name);
  }

  switch (cmd.type) {
    case 'Darwin-Growl':
      args.push(cmd.msg);
      args.push(msg.replace(/\\n/g, '\n'));
      if (options.title) args.push(options.title);
      if (options.url) {
        args.push(cmd.url);
        args.push(options.url);
      }
      break;
    case 'Darwin-NotificationCenter': {
      args.push(cmd.msg);
      const stringifiedMsg = msg;
      const escapedMsg = stringifiedMsg.replace(/\\n/g, '\n');
      args.push(escapedMsg);
      if (options.title) {
        args.push(cmd.title);
        args.push(options.title);
      }
      if (options.subtitle) {
        args.push(cmd.subtitle);
        args.push(options.subtitle);
      }
      if (options.url) {
        args.push(cmd.url);
        args.push(options.url);
      }
      break;
    }
    case 'Linux-Growl':
      args.push(cmd.msg);
      args.push(msg.replace(/\\n/g, '\n'));
      if (options.title) args.push(options.title);
      if (cmd.host) {
        args.push(cmd.host.cmd, cmd.host.hostname);
      }
      break;
    case 'Linux':
      if (options.title) args.push(options.title);
      args.push(msg.replace(/\\n/g, '\n'));
      break;
    case 'Windows':
      args.push(msg.replace(/\\n/g, '\n'));
      if (options.title) args.push(cmd.title + options.title);
      if (options.url) args.push(cmd.url + options.url);
      break;
    case 'Custom': {
      const customCmd = args[0];
      const message = options.title
        ? `${options.title}: ${msg}`
        : msg;
      let command = customCmd.replace(/(^|[^%])%s/g, `$1${message}`);
      const splitCmd = command.split(' ');
      if (splitCmd.length > 1) {
        command = splitCmd.shift();
        Array.prototype.push.apply(args, splitCmd);
      }
      if (customCmd.indexOf('%s') < 0) {
        args.push(message);
      }
      args[0] = command;
      break;
    }
  }
  const cmdToExec = args.shift();

  const child = spawn(cmdToExec, args);
  let stdout = '';
  let stderr = '';
  let error;

  const now = new Date();
  const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;

  stderr += `[${timestamp}][node-growl] : Executed command '${cmdToExec}' with arguments '${args}'\n[stderr] : `;

  child.on('error', (err) => {
    console.error('An error occured.', err);
    error = err;
  });

  child.stdout.on('data', (data) => {
    stdout += data;
  });

  child.stderr.on('data', (data) => {
    stderr += data;
  });

  child.on('close', () => {
    if (typeof fn === 'function') {
      fn(error, stdout, stderr);
    }
  });
}

/**
 * Expose `growl`.
 */

var growl_1 = growl;

/**
 * Desktop Notifications module.
 * @module Growl
 */



const {sync: which$2} = which_1;
const {EVENT_RUN_END} = runner.constants;
const {isBrowser} = utils;

/**
 * @summary
 * Checks if Growl notification support seems likely.
 *
 * @description
 * Glosses over the distinction between an unsupported platform
 * and one that lacks prerequisite software installations.
 *
 * @public
 * @see {@link https://github.com/tj/node-growl/blob/master/README.md|Prerequisite Installs}
 * @see {@link Mocha#growl}
 * @see {@link Mocha#isGrowlCapable}
 * @return {boolean} whether Growl notification support can be expected
 */
var isCapable = () => {
  if (!isBrowser()) {
    return getSupportBinaries().reduce(
      (acc, binary) => acc || Boolean(which$2(binary, {nothrow: true})),
      false
    );
  }
  return false;
};

/**
 * Implements desktop notifications as a pseudo-reporter.
 *
 * @public
 * @see {@link Mocha#_growl}
 * @param {Runner} runner - Runner instance.
 */
var notify = runner => {
  runner.once(EVENT_RUN_END, () => {
    display(runner);
  });
};

/**
 * Displays the notification.
 *
 * @private
 * @param {Runner} runner - Runner instance.
 */
const display = runner => {
  const growl = growl_1;
  const stats = runner.stats;
  const symbol = {
    cross: '\u274C',
    tick: '\u2705'
  };
  let _message;
  let message;
  let title;

  if (stats.failures) {
    _message = `${stats.failures} of ${stats.tests} tests failed`;
    message = `${symbol.cross} ${_message}`;
    title = 'Failed';
  } else {
    _message = `${stats.passes} tests passed in ${stats.duration}ms`;
    message = `${symbol.tick} ${_message}`;
    title = 'Passed';
  }

  // Send notification
  const options = {
    image: logo(),
    name: 'mocha',
    title
  };
  growl(message, options, onCompletion);
};

/**
 * @summary
 * Callback for result of attempted Growl notification.
 *
 * @description
 * Despite its appearance, this is <strong>not</strong> an Error-first
 * callback -- all parameters are populated regardless of success.
 *
 * @private
 * @callback Growl~growlCB
 * @param {*} err - Error object, or <code>null</code> if successful.
 */
function onCompletion(err) {
  if (err) {
    // As notifications are tangential to our purpose, just log the error.
    const message =
      err.code === 'ENOENT' ? 'prerequisite software not found' : err.message;
    console.error('notification error:', message);
  }
}

/**
 * Returns Mocha logo image path.
 *
 * @private
 * @return {string} Pathname of Mocha logo
 */
const logo = () => {
  return path.join(__dirname, '..', 'assets', 'mocha-logo-96.png');
};

/**
 * @summary
 * Gets platform-specific Growl support binaries.
 *
 * @description
 * Somewhat brittle dependency on `growl` package implementation, but it
 * rarely changes.
 *
 * @private
 * @see {@link https://github.com/tj/node-growl/blob/master/lib/growl.js#L28-L126|setupCmd}
 * @return {string[]} names of Growl support binaries
 */
const getSupportBinaries = () => {
  const binaries = {
    Darwin: ['terminal-notifier', 'growlnotify'],
    Linux: ['notify-send', 'growl'],
    Windows_NT: ['growlnotify.exe']
  };
  return binaries[os.type()] || [];
};

var growl$1 = {
	isCapable: isCapable,
	notify: notify
};

var diff$1 = true;
var extension = [
	"js",
	"cjs",
	"mjs"
];
var reporter = "spec";
var slow = 75;
var timeout = 2000;
var ui = "bdd";
var mocharc = {
	diff: diff$1,
	extension: extension,
	"package": "./package.json",
	reporter: reporter,
	slow: slow,
	timeout: timeout,
	ui: ui,
	"watch-ignore": [
	"node_modules",
	".git"
]
};

var mocharc$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	diff: diff$1,
	extension: extension,
	reporter: reporter,
	slow: slow,
	timeout: timeout,
	ui: ui,
	'default': mocharc
});

var esmUtils = createCommonjsModule(function (module, exports) {
const formattedImport = async file => {
  if (path.isAbsolute(file)) {
    return import(url.pathToFileURL(file));
  }
  return import(file);
};

exports.requireOrImport = async file => {
  if (path.extname(file) === '.mjs') {
    return formattedImport(file);
  }
  // This is currently the only known way of figuring out whether a file is CJS or ESM.
  // If Node.js or the community establish a better procedure for that, we can fix this code.
  // Another option here would be to always use `import()`, as this also supports CJS, but I would be
  // wary of using it for _all_ existing test files, till ESM is fully stable.
  try {
    return commonjsRequire(file);
  } catch (err) {
    if (err.code === 'ERR_REQUIRE_ESM') {
      return formattedImport(file);
    } else {
      throw err;
    }
  }
};

exports.loadFilesAsync = async (files, preLoadFunc, postLoadFunc) => {
  for (const file of files) {
    preLoadFunc(file);
    const result = await exports.requireOrImport(path.resolve(file));
    postLoadFunc(file, result);
  }
};
});

/**
 * Provides a factory function for a {@link StatsCollector} object.
 * @module
 */

var constants$3 = runner.constants;
var EVENT_TEST_PASS = constants$3.EVENT_TEST_PASS;
var EVENT_TEST_FAIL = constants$3.EVENT_TEST_FAIL;
var EVENT_SUITE_BEGIN = constants$3.EVENT_SUITE_BEGIN;
var EVENT_RUN_BEGIN = constants$3.EVENT_RUN_BEGIN;
var EVENT_TEST_PENDING = constants$3.EVENT_TEST_PENDING;
var EVENT_RUN_END$1 = constants$3.EVENT_RUN_END;
var EVENT_TEST_END = constants$3.EVENT_TEST_END;

/**
 * Test statistics collector.
 *
 * @public
 * @typedef {Object} StatsCollector
 * @property {number} suites - integer count of suites run.
 * @property {number} tests - integer count of tests run.
 * @property {number} passes - integer count of passing tests.
 * @property {number} pending - integer count of pending tests.
 * @property {number} failures - integer count of failed tests.
 * @property {Date} start - time when testing began.
 * @property {Date} end - time when testing concluded.
 * @property {number} duration - number of msecs that testing took.
 */

var Date$2 = commonjsGlobal.Date;

/**
 * Provides stats such as test duration, number of tests passed / failed etc., by listening for events emitted by `runner`.
 *
 * @private
 * @param {Runner} runner - Runner instance
 * @throws {TypeError} If falsy `runner`
 */
function createStatsCollector(runner) {
  /**
   * @type StatsCollector
   */
  var stats = {
    suites: 0,
    tests: 0,
    passes: 0,
    pending: 0,
    failures: 0
  };

  if (!runner) {
    throw new TypeError('Missing runner argument');
  }

  runner.stats = stats;

  runner.once(EVENT_RUN_BEGIN, function() {
    stats.start = new Date$2();
  });
  runner.on(EVENT_SUITE_BEGIN, function(suite) {
    suite.root || stats.suites++;
  });
  runner.on(EVENT_TEST_PASS, function() {
    stats.passes++;
  });
  runner.on(EVENT_TEST_FAIL, function() {
    stats.failures++;
  });
  runner.on(EVENT_TEST_PENDING, function() {
    stats.pending++;
  });
  runner.on(EVENT_TEST_END, function() {
    stats.tests++;
  });
  runner.once(EVENT_RUN_END$1, function() {
    stats.end = new Date$2();
    stats.duration = stats.end - stats.start;
  });
}

var statsCollector = createStatsCollector;

var createInvalidArgumentTypeError$1 = errors.createInvalidArgumentTypeError;
var isString = utils.isString;

var test = Test;

/**
 * Initialize a new `Test` with the given `title` and callback `fn`.
 *
 * @public
 * @class
 * @extends Runnable
 * @param {String} title - Test title (required)
 * @param {Function} [fn] - Test callback.  If omitted, the Test is considered "pending"
 */
function Test(title, fn) {
  if (!isString(title)) {
    throw createInvalidArgumentTypeError$1(
      'Test argument "title" should be a string. Received type "' +
        typeof title +
        '"',
      'title',
      'string'
    );
  }
  this.type = 'test';
  runnable.call(this, title, fn);
  this.reset();
}

/**
 * Inherit from `Runnable.prototype`.
 */
utils.inherits(Test, runnable);

/**
 * Resets the state initially or for a next run.
 */
Test.prototype.reset = function() {
  runnable.prototype.reset.call(this);
  this.pending = !this.fn;
  delete this.state;
};

/**
 * Set or get retried test
 *
 * @private
 */
Test.prototype.retriedTest = function(n) {
  if (!arguments.length) {
    return this._retriedTest;
  }
  this._retriedTest = n;
};

/**
 * Add test to the list of tests marked `only`.
 *
 * @private
 */
Test.prototype.markOnly = function() {
  this.parent.appendOnlyTest(this);
};

Test.prototype.clone = function() {
  var test = new Test(this.title, this.fn);
  test.timeout(this.timeout());
  test.slow(this.slow());
  test.retries(this.retries());
  test.currentRetry(this.currentRetry());
  test.retriedTest(this.retriedTest() || this);
  test.globals(this.globals());
  test.parent = this.parent;
  test.file = this.file;
  test.ctx = this.ctx;
  return test;
};

/**
 * Returns an minimal object suitable for transmission over IPC.
 * Functions are represented by keys beginning with `$$`.
 * @private
 * @returns {Object}
 */
Test.prototype.serialize = function serialize() {
  return {
    $$currentRetry: this._currentRetry,
    $$fullTitle: this.fullTitle(),
    $$isPending: this.pending,
    $$retriedTest: this._retriedTest || null,
    $$slow: this._slow,
    $$titlePath: this.titlePath(),
    body: this.body,
    duration: this.duration,
    err: this.err,
    parent: {
      $$fullTitle: this.parent.fullTitle()
    },
    speed: this.speed,
    state: this.state,
    title: this.title,
    type: this.type,
    file: this.file
  };
};

/**
 @module interfaces/common
*/



var createMissingArgumentError$1 = errors.createMissingArgumentError;
var createUnsupportedError$2 = errors.createUnsupportedError;
var createForbiddenExclusivityError$1 = errors.createForbiddenExclusivityError;

/**
 * Functions common to more than one interface.
 *
 * @private
 * @param {Suite[]} suites
 * @param {Context} context
 * @param {Mocha} mocha
 * @return {Object} An object containing common functions.
 */
var common$1 = function(suites, context, mocha) {
  /**
   * Check if the suite should be tested.
   *
   * @private
   * @param {Suite} suite - suite to check
   * @returns {boolean}
   */
  function shouldBeTested(suite) {
    return (
      !mocha.options.grep ||
      (mocha.options.grep &&
        mocha.options.grep.test(suite.fullTitle()) &&
        !mocha.options.invert)
    );
  }

  return {
    /**
     * This is only present if flag --delay is passed into Mocha. It triggers
     * root suite execution.
     *
     * @param {Suite} suite The root suite.
     * @return {Function} A function which runs the root suite
     */
    runWithSuite: function runWithSuite(suite) {
      return function run() {
        suite.run();
      };
    },

    /**
     * Execute before running tests.
     *
     * @param {string} name
     * @param {Function} fn
     */
    before: function(name, fn) {
      suites[0].beforeAll(name, fn);
    },

    /**
     * Execute after running tests.
     *
     * @param {string} name
     * @param {Function} fn
     */
    after: function(name, fn) {
      suites[0].afterAll(name, fn);
    },

    /**
     * Execute before each test case.
     *
     * @param {string} name
     * @param {Function} fn
     */
    beforeEach: function(name, fn) {
      suites[0].beforeEach(name, fn);
    },

    /**
     * Execute after each test case.
     *
     * @param {string} name
     * @param {Function} fn
     */
    afterEach: function(name, fn) {
      suites[0].afterEach(name, fn);
    },

    suite: {
      /**
       * Create an exclusive Suite; convenience function
       * See docstring for create() below.
       *
       * @param {Object} opts
       * @returns {Suite}
       */
      only: function only(opts) {
        if (mocha.options.forbidOnly) {
          throw createForbiddenExclusivityError$1(mocha);
        }
        opts.isOnly = true;
        return this.create(opts);
      },

      /**
       * Create a Suite, but skip it; convenience function
       * See docstring for create() below.
       *
       * @param {Object} opts
       * @returns {Suite}
       */
      skip: function skip(opts) {
        opts.pending = true;
        return this.create(opts);
      },

      /**
       * Creates a suite.
       *
       * @param {Object} opts Options
       * @param {string} opts.title Title of Suite
       * @param {Function} [opts.fn] Suite Function (not always applicable)
       * @param {boolean} [opts.pending] Is Suite pending?
       * @param {string} [opts.file] Filepath where this Suite resides
       * @param {boolean} [opts.isOnly] Is Suite exclusive?
       * @returns {Suite}
       */
      create: function create(opts) {
        var suite$1 = suite.create(suites[0], opts.title);
        suite$1.pending = Boolean(opts.pending);
        suite$1.file = opts.file;
        suites.unshift(suite$1);
        if (opts.isOnly) {
          suite$1.markOnly();
        }
        if (
          suite$1.pending &&
          mocha.options.forbidPending &&
          shouldBeTested(suite$1)
        ) {
          throw createUnsupportedError$2('Pending test forbidden');
        }
        if (typeof opts.fn === 'function') {
          opts.fn.call(suite$1);
          suites.shift();
        } else if (typeof opts.fn === 'undefined' && !suite$1.pending) {
          throw createMissingArgumentError$1(
            'Suite "' +
              suite$1.fullTitle() +
              '" was defined but no callback was supplied. ' +
              'Supply a callback or explicitly skip the suite.',
            'callback',
            'function'
          );
        } else if (!opts.fn && suite$1.pending) {
          suites.shift();
        }

        return suite$1;
      }
    },

    test: {
      /**
       * Exclusive test-case.
       *
       * @param {Object} mocha
       * @param {Function} test
       * @returns {*}
       */
      only: function(mocha, test) {
        if (mocha.options.forbidOnly) {
          throw createForbiddenExclusivityError$1(mocha);
        }
        test.markOnly();
        return test;
      },

      /**
       * Pending test case.
       *
       * @param {string} title
       */
      skip: function(title) {
        context.test(title);
      },

      /**
       * Number of retry attempts
       *
       * @param {number} n
       */
      retries: function(n) {
        context.retries(n);
      }
    }
  };
};

var EVENT_FILE_PRE_REQUIRE = suite.constants
  .EVENT_FILE_PRE_REQUIRE;

/**
 * BDD-style interface:
 *
 *      describe('Array', function() {
 *        describe('#indexOf()', function() {
 *          it('should return -1 when not present', function() {
 *            // ...
 *          });
 *
 *          it('should return the index when present', function() {
 *            // ...
 *          });
 *        });
 *      });
 *
 * @param {Suite} suite Root suite.
 */
var bdd = function bddInterface(suite) {
  var suites = [suite];

  suite.on(EVENT_FILE_PRE_REQUIRE, function(context, file, mocha) {
    var common = common$1(suites, context, mocha);

    context.before = common.before;
    context.after = common.after;
    context.beforeEach = common.beforeEach;
    context.afterEach = common.afterEach;
    context.run = mocha.options.delay && common.runWithSuite(suite);
    /**
     * Describe a "suite" with the given `title`
     * and callback `fn` containing nested suites
     * and/or tests.
     */

    context.describe = context.context = function(title, fn) {
      return common.suite.create({
        title: title,
        file: file,
        fn: fn
      });
    };

    /**
     * Pending describe.
     */

    context.xdescribe = context.xcontext = context.describe.skip = function(
      title,
      fn
    ) {
      return common.suite.skip({
        title: title,
        file: file,
        fn: fn
      });
    };

    /**
     * Exclusive suite.
     */

    context.describe.only = function(title, fn) {
      return common.suite.only({
        title: title,
        file: file,
        fn: fn
      });
    };

    /**
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     */

    context.it = context.specify = function(title, fn) {
      var suite = suites[0];
      if (suite.isPending()) {
        fn = null;
      }
      var test$1 = new test(title, fn);
      test$1.file = file;
      suite.addTest(test$1);
      return test$1;
    };

    /**
     * Exclusive test-case.
     */

    context.it.only = function(title, fn) {
      return common.test.only(mocha, context.it(title, fn));
    };

    /**
     * Pending test case.
     */

    context.xit = context.xspecify = context.it.skip = function(title) {
      return context.it(title);
    };

    /**
     * Number of attempts to retry.
     */
    context.it.retries = function(n) {
      context.retries(n);
    };
  });
};

var description = 'BDD or RSpec style [default]';
bdd.description = description;

var EVENT_FILE_PRE_REQUIRE$1 = suite.constants
  .EVENT_FILE_PRE_REQUIRE;

/**
 * TDD-style interface:
 *
 *      suite('Array', function() {
 *        suite('#indexOf()', function() {
 *          suiteSetup(function() {
 *
 *          });
 *
 *          test('should return -1 when not present', function() {
 *
 *          });
 *
 *          test('should return the index when present', function() {
 *
 *          });
 *
 *          suiteTeardown(function() {
 *
 *          });
 *        });
 *      });
 *
 * @param {Suite} suite Root suite.
 */
var tdd = function(suite) {
  var suites = [suite];

  suite.on(EVENT_FILE_PRE_REQUIRE$1, function(context, file, mocha) {
    var common = common$1(suites, context, mocha);

    context.setup = common.beforeEach;
    context.teardown = common.afterEach;
    context.suiteSetup = common.before;
    context.suiteTeardown = common.after;
    context.run = mocha.options.delay && common.runWithSuite(suite);

    /**
     * Describe a "suite" with the given `title` and callback `fn` containing
     * nested suites and/or tests.
     */
    context.suite = function(title, fn) {
      return common.suite.create({
        title: title,
        file: file,
        fn: fn
      });
    };

    /**
     * Pending suite.
     */
    context.suite.skip = function(title, fn) {
      return common.suite.skip({
        title: title,
        file: file,
        fn: fn
      });
    };

    /**
     * Exclusive test-case.
     */
    context.suite.only = function(title, fn) {
      return common.suite.only({
        title: title,
        file: file,
        fn: fn
      });
    };

    /**
     * Describe a specification or test-case with the given `title` and
     * callback `fn` acting as a thunk.
     */
    context.test = function(title, fn) {
      var suite = suites[0];
      if (suite.isPending()) {
        fn = null;
      }
      var test$1 = new test(title, fn);
      test$1.file = file;
      suite.addTest(test$1);
      return test$1;
    };

    /**
     * Exclusive test-case.
     */

    context.test.only = function(title, fn) {
      return common.test.only(mocha, context.test(title, fn));
    };

    context.test.skip = common.test.skip;
    context.test.retries = common.test.retries;
  });
};

var description$1 =
  'traditional "suite"/"test" instead of BDD\'s "describe"/"it"';
tdd.description = description$1;

var EVENT_FILE_PRE_REQUIRE$2 = suite.constants
  .EVENT_FILE_PRE_REQUIRE;

/**
 * QUnit-style interface:
 *
 *     suite('Array');
 *
 *     test('#length', function() {
 *       var arr = [1,2,3];
 *       ok(arr.length == 3);
 *     });
 *
 *     test('#indexOf()', function() {
 *       var arr = [1,2,3];
 *       ok(arr.indexOf(1) == 0);
 *       ok(arr.indexOf(2) == 1);
 *       ok(arr.indexOf(3) == 2);
 *     });
 *
 *     suite('String');
 *
 *     test('#length', function() {
 *       ok('foo'.length == 3);
 *     });
 *
 * @param {Suite} suite Root suite.
 */
var qunit = function qUnitInterface(suite) {
  var suites = [suite];

  suite.on(EVENT_FILE_PRE_REQUIRE$2, function(context, file, mocha) {
    var common = common$1(suites, context, mocha);

    context.before = common.before;
    context.after = common.after;
    context.beforeEach = common.beforeEach;
    context.afterEach = common.afterEach;
    context.run = mocha.options.delay && common.runWithSuite(suite);
    /**
     * Describe a "suite" with the given `title`.
     */

    context.suite = function(title) {
      if (suites.length > 1) {
        suites.shift();
      }
      return common.suite.create({
        title: title,
        file: file,
        fn: false
      });
    };

    /**
     * Exclusive Suite.
     */

    context.suite.only = function(title) {
      if (suites.length > 1) {
        suites.shift();
      }
      return common.suite.only({
        title: title,
        file: file,
        fn: false
      });
    };

    /**
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     */

    context.test = function(title, fn) {
      var test$1 = new test(title, fn);
      test$1.file = file;
      suites[0].addTest(test$1);
      return test$1;
    };

    /**
     * Exclusive test-case.
     */

    context.test.only = function(title, fn) {
      return common.test.only(mocha, context.test(title, fn));
    };

    context.test.skip = common.test.skip;
    context.test.retries = common.test.retries;
  });
};

var description$2 = 'QUnit style';
qunit.description = description$2;

/**
 * Exports-style (as Node.js module) interface:
 *
 *     exports.Array = {
 *       '#indexOf()': {
 *         'should return -1 when the value is not present': function() {
 *
 *         },
 *
 *         'should return the correct index when the value is present': function() {
 *
 *         }
 *       }
 *     };
 *
 * @param {Suite} suite Root suite.
 */
var exports = function(suite$1) {
  var suites = [suite$1];

  suite$1.on(suite.constants.EVENT_FILE_REQUIRE, visit);

  function visit(obj, file) {
    var suite$1;
    for (var key in obj) {
      if (typeof obj[key] === 'function') {
        var fn = obj[key];
        switch (key) {
          case 'before':
            suites[0].beforeAll(fn);
            break;
          case 'after':
            suites[0].afterAll(fn);
            break;
          case 'beforeEach':
            suites[0].beforeEach(fn);
            break;
          case 'afterEach':
            suites[0].afterEach(fn);
            break;
          default:
            var test$1 = new test(key, fn);
            test$1.file = file;
            suites[0].addTest(test$1);
        }
      } else {
        suite$1 = suite.create(suites[0], key);
        suites.unshift(suite$1);
        visit(obj[key], file);
        suites.shift();
      }
    }
  }
};

var description$3 = 'Node.js module ("exports") style';
exports.description = description$3;

var bdd$1 = bdd;
var tdd$1 = tdd;
var qunit$1 = qunit;
var exports$1 = exports;

var interfaces = {
	bdd: bdd$1,
	tdd: tdd$1,
	qunit: qunit$1,
	exports: exports$1
};

/**
 * @module Context
 */
/**
 * Expose `Context`.
 */

var context = Context;

/**
 * Initialize a new `Context`.
 *
 * @private
 */
function Context() {}

/**
 * Set or get the context `Runnable` to `runnable`.
 *
 * @private
 * @param {Runnable} runnable
 * @return {Context} context
 */
Context.prototype.runnable = function(runnable) {
  if (!arguments.length) {
    return this._runnable;
  }
  this.test = this._runnable = runnable;
  return this;
};

/**
 * Set or get test timeout `ms`.
 *
 * @private
 * @param {number} ms
 * @return {Context} self
 */
Context.prototype.timeout = function(ms) {
  if (!arguments.length) {
    return this.runnable().timeout();
  }
  this.runnable().timeout(ms);
  return this;
};

/**
 * Set or get test slowness threshold `ms`.
 *
 * @private
 * @param {number} ms
 * @return {Context} self
 */
Context.prototype.slow = function(ms) {
  if (!arguments.length) {
    return this.runnable().slow();
  }
  this.runnable().slow(ms);
  return this;
};

/**
 * Mark a test as skipped.
 *
 * @private
 * @throws Pending
 */
Context.prototype.skip = function() {
  this.runnable().skip();
};

/**
 * Set or get a number of allowed retries on failed tests
 *
 * @private
 * @param {number} n
 * @return {Context} self
 */
Context.prototype.retries = function(n) {
  if (!arguments.length) {
    return this.runnable().retries();
  }
  this.runnable().retries(n);
  return this;
};

var name = "mocha";
var version = "8.1.1";
var description$4 = "simple, flexible, fun test framework";
var keywords = [
	"mocha",
	"test",
	"bdd",
	"tdd",
	"tap",
	"testing",
	"chai",
	"assertion",
	"ava",
	"jest",
	"tape",
	"jasmine",
	"karma"
];
var funding = {
	type: "opencollective",
	url: "https://opencollective.com/mochajs"
};
var author = "TJ Holowaychuk <tj@vision-media.ca>";
var license = "MIT";
var repository = {
	type: "git",
	url: "https://github.com/mochajs/mocha.git"
};
var bugs = {
	url: "https://github.com/mochajs/mocha/issues/"
};
var homepage = "https://mochajs.org/";
var logo$1 = "https://cldup.com/S9uQ-cOLYz.svg";
var notifyLogo = "https://ibin.co/4QuRuGjXvl36.png";
var bin = {
	mocha: "./bin/mocha",
	_mocha: "./bin/_mocha"
};
var directories = {
	lib: "./lib",
	test: "./test"
};
var engines = {
	node: ">= 10.12.0"
};
var scripts = {
	prepublishOnly: "nps test clean build",
	start: "nps",
	test: "nps test",
	version: "nps version"
};
var dependencies = {
	"ansi-colors": "4.1.1",
	"browser-stdout": "1.3.1",
	chokidar: "3.3.1",
	debug: "3.2.6",
	diff: "4.0.2",
	"escape-string-regexp": "1.0.5",
	"find-up": "4.1.0",
	glob: "7.1.6",
	growl: "1.10.5",
	he: "1.2.0",
	"js-yaml": "3.13.1",
	"log-symbols": "3.0.0",
	minimatch: "3.0.4",
	ms: "2.1.2",
	"object.assign": "4.1.0",
	"promise.allsettled": "1.0.2",
	"serialize-javascript": "4.0.0",
	"strip-json-comments": "3.0.1",
	"supports-color": "7.1.0",
	which: "2.0.2",
	"wide-align": "1.1.3",
	workerpool: "6.0.0",
	yargs: "13.3.2",
	"yargs-parser": "13.1.2",
	"yargs-unparser": "1.6.1"
};
var devDependencies = {
	"@11ty/eleventy": "^0.10.0",
	"@11ty/eleventy-plugin-inclusive-language": "^1.0.0",
	"@babel/preset-env": "^7.10.4",
	"@mocha/docdash": "^2.1.3",
	"@rollup/plugin-babel": "^5.0.4",
	"@rollup/plugin-commonjs": "^13.0.0",
	"@rollup/plugin-json": "^4.1.0",
	"@rollup/plugin-multi-entry": "^3.0.1",
	"@rollup/plugin-node-resolve": "^8.1.0",
	"assetgraph-builder": "^8.1.0",
	autoprefixer: "^9.7.4",
	"babel-eslint": "^10.1.0",
	canvas: "^2.6.1",
	chai: "^4.2.0",
	"coffee-script": "^1.12.7",
	"core-js": "^3.6.5",
	coveralls: "^3.0.11",
	"cross-env": "^6.0.3",
	"cross-spawn": "^7.0.1",
	eslint: "^6.8.0",
	"eslint-config-prettier": "^6.10.0",
	"eslint-config-semistandard": "^15.0.0",
	"eslint-config-standard": "^14.1.1",
	"eslint-plugin-import": "^2.20.1",
	"eslint-plugin-node": "^11.0.0",
	"eslint-plugin-prettier": "^3.1.2",
	"eslint-plugin-promise": "^4.2.1",
	"eslint-plugin-standard": "^4.0.1",
	"fs-extra": "^9.0.0",
	husky: "^4.2.3",
	hyperlink: "^4.5.0",
	jsdoc: "^3.6.3",
	karma: "^5.1.1",
	"karma-chrome-launcher": "^3.1.0",
	"karma-mocha": "^2.0.1",
	"karma-mocha-reporter": "^2.2.5",
	"karma-requirejs": "^1.1.0",
	"karma-sauce-launcher": "^2.0.2",
	"lint-staged": "^9.5.0",
	"markdown-it": "^10.0.0",
	"markdown-it-anchor": "^5.2.5",
	"markdown-it-attrs": "^3.0.2",
	"markdown-it-emoji": "^1.4.0",
	"markdown-it-prism": "^2.0.5",
	"markdown-toc": "^1.2.0",
	"markdownlint-cli": "^0.22.0",
	needle: "^2.4.1",
	nps: "^5.9.12",
	nyc: "^15.0.0",
	prettier: "^1.19.1",
	remark: "^11.0.2",
	"remark-github": "^8.0.0",
	"remark-inline-links": "^3.1.3",
	requirejs: "^2.3.6",
	rewiremock: "^3.14.1",
	rimraf: "^3.0.2",
	rollup: "^2.18.2",
	"rollup-plugin-node-builtins": "^2.1.2",
	"rollup-plugin-node-globals": "^1.4.0",
	"rollup-plugin-visualizer": "^3.3.2",
	sinon: "^9.0.1",
	"strip-ansi": "^6.0.0",
	svgo: "^1.3.2",
	through2: "^3.0.1",
	"to-vfile": "^6.1.0",
	unexpected: "^11.14.0",
	"unexpected-eventemitter": "^2.2.0",
	"unexpected-sinon": "^10.11.2",
	uslug: "^1.0.4",
	uuid: "^8.0.0",
	watchify: "^3.11.1"
};
var files = [
	"bin/*mocha",
	"assets/growl/*.png",
	"lib/**/*.{js,html,json}",
	"index.js",
	"mocha.css",
	"mocha.js",
	"mocha.js.map",
	"browser-entry.js"
];
var browser$1 = {
	"./index.js": "./browser-entry.js",
	"./lib/nodejs/growl.js": "./lib/browser/growl.js",
	"./lib/esm-utils.js": false,
	fs: false,
	path: false,
	"supports-color": false,
	"./lib/nodejs/serializer.js": false,
	"./lib/nodejs/worker.js": false,
	"./lib/nodejs/buffered-worker-pool.js": false,
	"./lib/nodejs/parallel-buffered-runner.js": false,
	"./lib/nodejs/reporters/parallel-buffered.js": false
};
var prettier = {
	singleQuote: true,
	bracketSpacing: false,
	endOfLine: "auto"
};
var gitter = "https://gitter.im/mochajs/mocha";
var husky = {
	hooks: {
		"pre-commit": "lint-staged"
	}
};
var _package = {
	name: name,
	version: version,
	description: description$4,
	keywords: keywords,
	funding: funding,
	author: author,
	license: license,
	repository: repository,
	bugs: bugs,
	homepage: homepage,
	logo: logo$1,
	notifyLogo: notifyLogo,
	bin: bin,
	directories: directories,
	engines: engines,
	scripts: scripts,
	dependencies: dependencies,
	devDependencies: devDependencies,
	files: files,
	browser: browser$1,
	prettier: prettier,
	gitter: gitter,
	husky: husky
};

var _package$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	name: name,
	version: version,
	description: description$4,
	keywords: keywords,
	funding: funding,
	author: author,
	license: license,
	repository: repository,
	bugs: bugs,
	homepage: homepage,
	logo: logo$1,
	notifyLogo: notifyLogo,
	bin: bin,
	directories: directories,
	engines: engines,
	scripts: scripts,
	dependencies: dependencies,
	devDependencies: devDependencies,
	files: files,
	browser: browser$1,
	prettier: prettier,
	gitter: gitter,
	husky: husky,
	'default': _package
});

var requirePromise = function requirePromise() {
	if (typeof Promise !== 'function') {
		throw new TypeError('`Promise.allSettled` requires a global `Promise` be available.');
	}
};

var origSymbol = commonjsGlobal.Symbol;


var hasSymbols$2 = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return shams();
};

/* globals
	Atomics,
	SharedArrayBuffer,
*/

var undefined$1;

var $TypeError = TypeError;

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () { throw new $TypeError(); };
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols$3 = hasSymbols$2();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto
var generatorFunction =  undefined$1;
var asyncFunction =  undefined$1;
var asyncGenFunction =  undefined$1;

var TypedArray = typeof Uint8Array === 'undefined' ? undefined$1 : getProto(Uint8Array);

var INTRINSICS = {
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
	'%ArrayBufferPrototype%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer.prototype,
	'%ArrayIteratorPrototype%': hasSymbols$3 ? getProto([][Symbol.iterator]()) : undefined$1,
	'%ArrayPrototype%': Array.prototype,
	'%ArrayProto_entries%': Array.prototype.entries,
	'%ArrayProto_forEach%': Array.prototype.forEach,
	'%ArrayProto_keys%': Array.prototype.keys,
	'%ArrayProto_values%': Array.prototype.values,
	'%AsyncFromSyncIteratorPrototype%': undefined$1,
	'%AsyncFunction%': asyncFunction,
	'%AsyncFunctionPrototype%':  undefined$1,
	'%AsyncGenerator%':  undefined$1,
	'%AsyncGeneratorFunction%': asyncGenFunction,
	'%AsyncGeneratorPrototype%':  undefined$1,
	'%AsyncIteratorPrototype%':  undefined$1,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
	'%Boolean%': Boolean,
	'%BooleanPrototype%': Boolean.prototype,
	'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
	'%DataViewPrototype%': typeof DataView === 'undefined' ? undefined$1 : DataView.prototype,
	'%Date%': Date,
	'%DatePrototype%': Date.prototype,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%ErrorPrototype%': Error.prototype,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%EvalErrorPrototype%': EvalError.prototype,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
	'%Float32ArrayPrototype%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array.prototype,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
	'%Float64ArrayPrototype%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array.prototype,
	'%Function%': Function,
	'%FunctionPrototype%': Function.prototype,
	'%Generator%':  undefined$1,
	'%GeneratorFunction%': generatorFunction,
	'%GeneratorPrototype%':  undefined$1,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
	'%Int8ArrayPrototype%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array.prototype,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
	'%Int16ArrayPrototype%': typeof Int16Array === 'undefined' ? undefined$1 : Int8Array.prototype,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
	'%Int32ArrayPrototype%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array.prototype,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols$3 ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
	'%JSONParse%': typeof JSON === 'object' ? JSON.parse : undefined$1,
	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$3 ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
	'%MapPrototype%': typeof Map === 'undefined' ? undefined$1 : Map.prototype,
	'%Math%': Math,
	'%Number%': Number,
	'%NumberPrototype%': Number.prototype,
	'%Object%': Object,
	'%ObjectPrototype%': Object.prototype,
	'%ObjProto_toString%': Object.prototype.toString,
	'%ObjProto_valueOf%': Object.prototype.valueOf,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
	'%PromisePrototype%': typeof Promise === 'undefined' ? undefined$1 : Promise.prototype,
	'%PromiseProto_then%': typeof Promise === 'undefined' ? undefined$1 : Promise.prototype.then,
	'%Promise_all%': typeof Promise === 'undefined' ? undefined$1 : Promise.all,
	'%Promise_reject%': typeof Promise === 'undefined' ? undefined$1 : Promise.reject,
	'%Promise_resolve%': typeof Promise === 'undefined' ? undefined$1 : Promise.resolve,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
	'%RangeError%': RangeError,
	'%RangeErrorPrototype%': RangeError.prototype,
	'%ReferenceError%': ReferenceError,
	'%ReferenceErrorPrototype%': ReferenceError.prototype,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
	'%RegExp%': RegExp,
	'%RegExpPrototype%': RegExp.prototype,
	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$3 ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
	'%SetPrototype%': typeof Set === 'undefined' ? undefined$1 : Set.prototype,
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
	'%SharedArrayBufferPrototype%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer.prototype,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols$3 ? getProto(''[Symbol.iterator]()) : undefined$1,
	'%StringPrototype%': String.prototype,
	'%Symbol%': hasSymbols$3 ? Symbol : undefined$1,
	'%SymbolPrototype%': hasSymbols$3 ? Symbol.prototype : undefined$1,
	'%SyntaxError%': SyntaxError,
	'%SyntaxErrorPrototype%': SyntaxError.prototype,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypedArrayPrototype%': TypedArray ? TypedArray.prototype : undefined$1,
	'%TypeError%': $TypeError,
	'%TypeErrorPrototype%': $TypeError.prototype,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
	'%Uint8ArrayPrototype%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array.prototype,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
	'%Uint8ClampedArrayPrototype%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray.prototype,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
	'%Uint16ArrayPrototype%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array.prototype,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
	'%Uint32ArrayPrototype%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array.prototype,
	'%URIError%': URIError,
	'%URIErrorPrototype%': URIError.prototype,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
	'%WeakMapPrototype%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap.prototype,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet,
	'%WeakSetPrototype%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet.prototype
};


var $replace = functionBind.call(Function.call, String.prototype.replace);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : (number || match);
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	if (!(name in INTRINSICS)) {
		throw new SyntaxError('intrinsic ' + name + ' does not exist!');
	}

	// istanbul ignore if // hopefully this is impossible to test :-)
	if (typeof INTRINSICS[name] === 'undefined' && !allowMissing) {
		throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
	}

	return INTRINSICS[name];
};

var GetIntrinsic = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);

	var value = getBaseIntrinsic('%' + (parts.length > 0 ? parts[0] : '') + '%', allowMissing);
	for (var i = 1; i < parts.length; i += 1) {
		if (value != null) {
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, parts[i]);
				if (!allowMissing && !(parts[i] in value)) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				value = desc ? (desc.get || desc.value) : value[parts[i]];
			} else {
				value = value[parts[i]];
			}
		}
	}
	return value;
};

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || functionBind.call($call, $apply);

var callBind = function callBind() {
	return $reflectApply(functionBind, $call, arguments);
};

var apply = function applyBind() {
	return $reflectApply(functionBind, $apply, arguments);
};
callBind.apply = apply;

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

var callBound = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.')) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

var $PromiseResolve = callBound('Promise.resolve', true);

// https://ecma-international.org/ecma-262/9.0/#sec-promise-resolve

var PromiseResolve = function PromiseResolve(C, x) {
	if (!$PromiseResolve) {
		throw new SyntaxError('This environment does not support Promises.');
	}
	return $PromiseResolve(C, x);
};

// https://www.ecma-international.org/ecma-262/5.1/#sec-8

var Type = function Type(x) {
	if (x === null) {
		return 'Null';
	}
	if (typeof x === 'undefined') {
		return 'Undefined';
	}
	if (typeof x === 'function' || typeof x === 'object') {
		return 'Object';
	}
	if (typeof x === 'number') {
		return 'Number';
	}
	if (typeof x === 'boolean') {
		return 'Boolean';
	}
	if (typeof x === 'string') {
		return 'String';
	}
};

// https://ecma-international.org/ecma-262/6.0/#sec-ecmascript-data-types-and-values

var Type$1 = function Type$1(x) {
	if (typeof x === 'symbol') {
		return 'Symbol';
	}
	return Type(x);
};

var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var toStr$4 = Object.prototype.toString;

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return toStr$4.call(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		toStr$4.call(value) !== '[object Array]' &&
		toStr$4.call(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

var isArguments$1 = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

var toString$1 = {}.toString;

var isarray = Array.isArray || function (arr) {
  return toString$1.call(arr) == '[object Array]';
};

var strValue = String.prototype.valueOf;
var tryStringObject = function tryStringObject(value) {
	try {
		strValue.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr$5 = Object.prototype.toString;
var strClass = '[object String]';
var hasToStringTag$1 = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

var isString$1 = function isString(value) {
	if (typeof value === 'string') {
		return true;
	}
	if (typeof value !== 'object') {
		return false;
	}
	return hasToStringTag$1 ? tryStringObject(value) : toStr$5.call(value) === strClass;
};

var $Map = typeof Map === 'function' && Map.prototype ? Map : null;
var $Set = typeof Set === 'function' && Set.prototype ? Set : null;

var exported;

if (!$Map) {
	// eslint-disable-next-line no-unused-vars
	exported = function isMap(x) {
		// `Map` is not present in this environment.
		return false;
	};
}

var $mapHas = $Map ? Map.prototype.has : null;
var $setHas = $Set ? Set.prototype.has : null;
if (!exported && !$mapHas) {
	// eslint-disable-next-line no-unused-vars
	exported = function isMap(x) {
		// `Map` does not have a `has` method
		return false;
	};
}

var isMap = exported || function isMap(x) {
	if (!x || typeof x !== 'object') {
		return false;
	}
	try {
		$mapHas.call(x);
		if ($setHas) {
			try {
				$setHas.call(x);
			} catch (e) {
				return true;
			}
		}
		return x instanceof $Map; // core-js workaround, pre-v2.5.0
	} catch (e) {}
	return false;
};

var $Map$1 = typeof Map === 'function' && Map.prototype ? Map : null;
var $Set$1 = typeof Set === 'function' && Set.prototype ? Set : null;

var exported$1;

if (!$Set$1) {
	// eslint-disable-next-line no-unused-vars
	exported$1 = function isSet(x) {
		// `Set` is not present in this environment.
		return false;
	};
}

var $mapHas$1 = $Map$1 ? Map.prototype.has : null;
var $setHas$1 = $Set$1 ? Set.prototype.has : null;
if (!exported$1 && !$setHas$1) {
	// eslint-disable-next-line no-unused-vars
	exported$1 = function isSet(x) {
		// `Set` does not have a `has` method
		return false;
	};
}

var isSet = exported$1 || function isSet(x) {
	if (!x || typeof x !== 'object') {
		return false;
	}
	try {
		$setHas$1.call(x);
		if ($mapHas$1) {
			try {
				$mapHas$1.call(x);
			} catch (e) {
				return true;
			}
		}
		return x instanceof $Set$1; // core-js workaround, pre-v2.5.0
	} catch (e) {}
	return false;
};

var esGetIterator = createCommonjsModule(function (module) {

/* eslint global-require: 0 */
// the code is structured this way so that bundlers can
// alias out `has-symbols` to `() => true` or `() => false` if your target
// environments' Symbol capabilities are known, and then use
// dead code elimination on the rest of this module.
//
// Similarly, `isarray` can be aliased to `Array.isArray` if
// available in all target environments.



if (hasSymbols$2() || shams()) {
	var $iterator = Symbol.iterator;
	// Symbol is available natively or shammed
	// natively:
	//  - Chrome >= 38
	//  - Edge 12-14?, Edge >= 15 for sure
	//  - FF >= 36
	//  - Safari >= 9
	//  - node >= 0.12
	module.exports = function getIterator(iterable) {
		// alternatively, `iterable[$iterator]?.()`
		if (iterable != null && typeof iterable[$iterator] !== 'undefined') {
			return iterable[$iterator]();
		}
		if (isArguments$1(iterable)) {
			// arguments objects lack Symbol.iterator
			// - node 0.12
			return Array.prototype[$iterator].call(iterable);
		}
	};
} else {
	// Symbol is not available, native or shammed
	var isArray = isarray;
	var isString = isString$1;
	var GetIntrinsic$1 = GetIntrinsic;
	var $Map = GetIntrinsic$1('%Map%', true);
	var $Set = GetIntrinsic$1('%Set%', true);
	var callBound$1 = callBound;
	var $arrayPush = callBound$1('Array.prototype.push');
	var $charCodeAt = callBound$1('String.prototype.charCodeAt');
	var $stringSlice = callBound$1('String.prototype.slice');

	var advanceStringIndex = function advanceStringIndex(S, index) {
		var length = S.length;
		if ((index + 1) >= length) {
			return index + 1;
		}

		var first = $charCodeAt(S, index);
		if (first < 0xD800 || first > 0xDBFF) {
			return index + 1;
		}

		var second = $charCodeAt(S, index + 1);
		if (second < 0xDC00 || second > 0xDFFF) {
			return index + 1;
		}

		return index + 2;
	};

	var getArrayIterator = function getArrayIterator(arraylike) {
		var i = 0;
		return {
			next: function next() {
				var done = i >= arraylike.length;
				var value;
				if (!done) {
					value = arraylike[i];
					i += 1;
				}
				return {
					done: done,
					value: value
				};
			}
		};
	};

	var getNonCollectionIterator = function getNonCollectionIterator(iterable) {
		if (isArray(iterable) || isArguments$1(iterable)) {
			return getArrayIterator(iterable);
		}
		if (isString(iterable)) {
			var i = 0;
			return {
				next: function next() {
					var nextIndex = advanceStringIndex(iterable, i);
					var value = $stringSlice(iterable, i, nextIndex);
					i = nextIndex;
					return {
						done: nextIndex > iterable.length,
						value: value
					};
				}
			};
		}
	};

	if (!$Map && !$Set) {
		// the only language iterables are Array, String, arguments
		// - Safari <= 6.0
		// - Chrome < 38
		// - node < 0.12
		// - FF < 13
		// - IE < 11
		// - Edge < 11

		module.exports = getNonCollectionIterator;
	} else {
		// either Map or Set are available, but Symbol is not
		// - es6-shim on an ES5 browser
		// - Safari 6.2 (maybe 6.1?)
		// - FF v[13, 36)
		// - IE 11
		// - Edge 11
		// - Safari v[6, 9)

		var isMap$1 = isMap;
		var isSet$1 = isSet;

		// Firefox >= 27, IE 11, Safari 6.2 - 9, Edge 11, es6-shim in older envs, all have forEach
		var $mapForEach = callBound$1('Map.prototype.forEach', true);
		var $setForEach = callBound$1('Set.prototype.forEach', true);
		if (typeof process === 'undefined' || !process.versions || !process.versions.node) { // "if is not node"

			// Firefox 17 - 26 has `.iterator()`, whose iterator `.next()` either
			// returns a value, or throws a StopIteration object. These browsers
			// do not have any other mechanism for iteration.
			var $mapIterator = callBound$1('Map.prototype.iterator', true);
			var $setIterator = callBound$1('Set.prototype.iterator', true);
			var getStopIterationIterator = function (iterator) {
				var done = false;
				return {
					next: function next() {
						try {
							return {
								done: done,
								value: done ? undefined : iterator.next()
							};
						} catch (e) {
							done = true;
							return {
								done: true,
								value: undefined
							};
						}
					}
				};
			};
		}
		// Firefox 27-35, and some older es6-shim versions, use a string "@@iterator" property
		// this returns a proper iterator object, so we should use it instead of forEach.
		// newer es6-shim versions use a string "_es6-shim iterator_" property.
		var $mapAtAtIterator = callBound$1('Map.prototype.@@iterator', true) || callBound$1('Map.prototype._es6-shim iterator_', true);
		var $setAtAtIterator = callBound$1('Set.prototype.@@iterator', true) || callBound$1('Set.prototype._es6-shim iterator_', true);

		var getCollectionIterator = function getCollectionIterator(iterable) {
			if (isMap$1(iterable)) {
				if ($mapIterator) {
					return getStopIterationIterator($mapIterator(iterable));
				}
				if ($mapAtAtIterator) {
					return $mapAtAtIterator(iterable);
				}
				if ($mapForEach) {
					var entries = [];
					$mapForEach(iterable, function (v, k) {
						$arrayPush(entries, [k, v]);
					});
					return getArrayIterator(entries);
				}
			}
			if (isSet$1(iterable)) {
				if ($setIterator) {
					return getStopIterationIterator($setIterator(iterable));
				}
				if ($setAtAtIterator) {
					return $setAtAtIterator(iterable);
				}
				if ($setForEach) {
					var values = [];
					$setForEach(iterable, function (v) {
						$arrayPush(values, v);
					});
					return getArrayIterator(values);
				}
			}
		};

		module.exports = function getIterator(iterable) {
			return getCollectionIterator(iterable) || getNonCollectionIterator(iterable);
		};
	}
}
});

var $TypeError$1 = TypeError;

// eslint-disable-next-line consistent-return
var iterateIterator = function iterateIterator(iterator) {
	if (!iterator || typeof iterator.next !== 'function') {
		throw new $TypeError$1('iterator must be an object with a `next` method');
	}
	if (arguments.length > 1) {
		var callback = arguments[1];
		if (typeof callback !== 'function') {
			throw new $TypeError$1('`callback`, if provided, must be a function');
		}
	}
	var values = callback || [];
	var result;
	while ((result = iterator.next()) && !result.done) {
		if (callback) {
			callback(result.value); // eslint-disable-line callback-return
		} else {
			values.push(result.value);
		}
	}
	if (!callback) {
		return values;
	}
};

var $TypeError$2 = TypeError;


var iterateValue = function iterateValue(iterable) {
	var iterator = esGetIterator(iterable);
	if (!iterator) {
		throw new $TypeError$2('non-iterable value provided');
	}
	if (arguments.length > 1) {
		return iterateIterator(iterator, arguments[1]);
	}
	return iterateIterator(iterator);
};

var $TypeError$3 = GetIntrinsic('%TypeError%');

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.10

var CheckObjectCoercible = function CheckObjectCoercible(value, optMessage) {
	if (value == null) {
		throw new $TypeError$3(optMessage || ('Cannot call method on ' + value));
	}
	return value;
};

var RequireObjectCoercible = CheckObjectCoercible;

var util_inspect = util.inspect;

var hasMap = typeof Map === 'function' && Map.prototype;
var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === 'function' && Set.prototype;
var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var match = String.prototype.match;
var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;

var inspectCustom = util_inspect.custom;
var inspectSymbol = inspectCustom && isSymbol(inspectCustom) ? inspectCustom : null;

var objectInspect = function inspect_(obj, options, depth, seen) {
    var opts = options || {};

    if (has$1(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
    }
    if (
        has$1(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
            : opts.maxStringLength !== null
        )
    ) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    }
    var customInspect = has$1(opts, 'customInspect') ? opts.customInspect : true;
    if (typeof customInspect !== 'boolean') {
        throw new TypeError('option "customInspect", if provided, must be `true` or `false`');
    }

    if (
        has$1(opts, 'indent')
        && opts.indent !== null
        && opts.indent !== '\t'
        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
        throw new TypeError('options "indent" must be "\\t", an integer > 0, or `null`');
    }

    if (typeof obj === 'undefined') {
        return 'undefined';
    }
    if (obj === null) {
        return 'null';
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (typeof obj === 'string') {
        return inspectString(obj, opts);
    }
    if (typeof obj === 'number') {
        if (obj === 0) {
            return Infinity / obj > 0 ? '0' : '-0';
        }
        return String(obj);
    }
    if (typeof obj === 'bigint') { // eslint-disable-line valid-typeof
        return String(obj) + 'n';
    }

    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
    if (typeof depth === 'undefined') { depth = 0; }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
        return isArray(obj) ? '[Array]' : '[Object]';
    }

    var indent = getIndent(opts, depth);

    if (typeof seen === 'undefined') {
        seen = [];
    } else if (indexOf(seen, obj) >= 0) {
        return '[Circular]';
    }

    function inspect(value, from, noIndent) {
        if (from) {
            seen = seen.slice();
            seen.push(from);
        }
        if (noIndent) {
            var newOpts = {
                depth: opts.depth
            };
            if (has$1(opts, 'quoteStyle')) {
                newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
    }

    if (typeof obj === 'function') {
        var name = nameOf(obj);
        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']';
    }
    if (isSymbol(obj)) {
        var symString = Symbol.prototype.toString.call(obj);
        return typeof obj === 'object' ? markBoxed(symString) : symString;
    }
    if (isElement(obj)) {
        var s = '<' + String(obj.nodeName).toLowerCase();
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
        }
        s += '>';
        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
        s += '</' + String(obj.nodeName).toLowerCase() + '>';
        return s;
    }
    if (isArray(obj)) {
        if (obj.length === 0) { return '[]'; }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
            return '[' + indentedJoin(xs, indent) + ']';
        }
        return '[ ' + xs.join(', ') + ' ]';
    }
    if (isError$1(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (parts.length === 0) { return '[' + String(obj) + ']'; }
        return '{ [' + String(obj) + '] ' + parts.join(', ') + ' }';
    }
    if (typeof obj === 'object' && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === 'function') {
            return obj[inspectSymbol]();
        } else if (typeof obj.inspect === 'function') {
            return obj.inspect();
        }
    }
    if (isMap$1(obj)) {
        var mapParts = [];
        mapForEach.call(obj, function (value, key) {
            mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
        });
        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
    }
    if (isSet$1(obj)) {
        var setParts = [];
        setForEach.call(obj, function (value) {
            setParts.push(inspect(value, obj));
        });
        return collectionOf('Set', setSize.call(obj), setParts, indent);
    }
    if (isWeakMap(obj)) {
        return weakCollectionOf('WeakMap');
    }
    if (isWeakSet(obj)) {
        return weakCollectionOf('WeakSet');
    }
    if (isNumber(obj)) {
        return markBoxed(inspect(Number(obj)));
    }
    if (isBigInt(obj)) {
        return markBoxed(inspect(bigIntValueOf.call(obj)));
    }
    if (isBoolean(obj)) {
        return markBoxed(booleanValueOf.call(obj));
    }
    if (isString$2(obj)) {
        return markBoxed(inspect(String(obj)));
    }
    if (!isDate(obj) && !isRegExp(obj)) {
        var ys = arrObjKeys(obj, inspect);
        if (ys.length === 0) { return '{}'; }
        if (indent) {
            return '{' + indentedJoin(ys, indent) + '}';
        }
        return '{ ' + ys.join(', ') + ' }';
    }
    return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
    return quoteChar + s + quoteChar;
}

function quote(s) {
    return String(s).replace(/"/g, '&quot;');
}

function isArray(obj) { return toStr$6(obj) === '[object Array]'; }
function isDate(obj) { return toStr$6(obj) === '[object Date]'; }
function isRegExp(obj) { return toStr$6(obj) === '[object RegExp]'; }
function isError$1(obj) { return toStr$6(obj) === '[object Error]'; }
function isSymbol(obj) { return toStr$6(obj) === '[object Symbol]'; }
function isString$2(obj) { return toStr$6(obj) === '[object String]'; }
function isNumber(obj) { return toStr$6(obj) === '[object Number]'; }
function isBigInt(obj) { return toStr$6(obj) === '[object BigInt]'; }
function isBoolean(obj) { return toStr$6(obj) === '[object Boolean]'; }

var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
function has$1(obj, key) {
    return hasOwn.call(obj, key);
}

function toStr$6(obj) {
    return objectToString.call(obj);
}

function nameOf(f) {
    if (f.name) { return f.name; }
    var m = match.call(functionToString.call(f), /^function\s*([\w$]+)/);
    if (m) { return m[1]; }
    return null;
}

function indexOf(xs, x) {
    if (xs.indexOf) { return xs.indexOf(x); }
    for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) { return i; }
    }
    return -1;
}

function isMap$1(x) {
    if (!mapSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        mapSize.call(x);
        try {
            setSize.call(x);
        } catch (s) {
            return true;
        }
        return x instanceof Map; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakMap(x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakMapHas.call(x, weakMapHas);
        try {
            weakSetHas.call(x, weakSetHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isSet$1(x) {
    if (!setSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        setSize.call(x);
        try {
            mapSize.call(x);
        } catch (m) {
            return true;
        }
        return x instanceof Set; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakSet(x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakSetHas.call(x, weakSetHas);
        try {
            weakMapHas.call(x, weakMapHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isElement(x) {
    if (!x || typeof x !== 'object') { return false; }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
        return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
}

function inspectString(str, opts) {
    if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
        return inspectString(str.slice(0, opts.maxStringLength), opts) + trailer;
    }
    // eslint-disable-next-line no-control-regex
    var s = str.replace(/(['\\])/g, '\\$1').replace(/[\x00-\x1f]/g, lowbyte);
    return wrapQuotes(s, 'single', opts);
}

function lowbyte(c) {
    var n = c.charCodeAt(0);
    var x = {
        8: 'b', 9: 't', 10: 'n', 12: 'f', 13: 'r'
    }[n];
    if (x) { return '\\' + x; }
    return '\\x' + (n < 0x10 ? '0' : '') + n.toString(16);
}

function markBoxed(str) {
    return 'Object(' + str + ')';
}

function weakCollectionOf(type) {
    return type + ' { ? }';
}

function collectionOf(type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : entries.join(', ');
    return type + ' (' + size + ') {' + joinedEntries + '}';
}

function singleLineValues(xs) {
    for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], '\n') >= 0) {
            return false;
        }
    }
    return true;
}

function getIndent(opts, depth) {
    var baseIndent;
    if (opts.indent === '\t') {
        baseIndent = '\t';
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
        baseIndent = Array(opts.indent + 1).join(' ');
    } else {
        return null;
    }
    return {
        base: baseIndent,
        prev: Array(depth + 1).join(baseIndent)
    };
}

function indentedJoin(xs, indent) {
    if (xs.length === 0) { return ''; }
    var lineJoiner = '\n' + indent.prev + indent.base;
    return lineJoiner + xs.join(',' + lineJoiner) + '\n' + indent.prev;
}

function arrObjKeys(obj, inspect) {
    var isArr = isArray(obj);
    var xs = [];
    if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
            xs[i] = has$1(obj, i) ? inspect(obj[i], obj) : '';
        }
    }
    for (var key in obj) { // eslint-disable-line no-restricted-syntax
        if (!has$1(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if ((/[^\w$]/).test(key)) {
            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
        } else {
            xs.push(key + ': ' + inspect(obj[key], obj));
        }
    }
    return xs;
}

// https://www.ecma-international.org/ecma-262/6.0/#sec-ispropertykey

var IsPropertyKey = function IsPropertyKey(argument) {
	return typeof argument === 'string' || typeof argument === 'symbol';
};

var $TypeError$4 = GetIntrinsic('%TypeError%');






/**
 * 7.3.1 Get (O, P) - https://ecma-international.org/ecma-262/6.0/#sec-get-o-p
 * 1. Assert: Type(O) is Object.
 * 2. Assert: IsPropertyKey(P) is true.
 * 3. Return O.[[Get]](P, O).
 */

var Get = function Get(O, P) {
	// 7.3.1.1
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$4('Assertion failed: Type(O) is not Object');
	}
	// 7.3.1.2
	if (!IsPropertyKey(P)) {
		throw new $TypeError$4('Assertion failed: IsPropertyKey(P) is not true, got ' + objectInspect(P));
	}
	// 7.3.1.3
	return O[P];
};

var $Array = GetIntrinsic('%Array%');

// eslint-disable-next-line global-require
var toStr$7 = !$Array.isArray && callBound('Object.prototype.toString');

// https://www.ecma-international.org/ecma-262/6.0/#sec-isarray

var IsArray = $Array.isArray || function IsArray(argument) {
	return toStr$7(argument) === '[object Array]';
};

var src$1 = functionBind.call(Function.call, Object.prototype.hasOwnProperty);

var $TypeError$5 = GetIntrinsic('%TypeError%');

var isPropertyDescriptor = function IsPropertyDescriptor(ES, Desc) {
	if (ES.Type(Desc) !== 'Object') {
		return false;
	}
	var allowed = {
		'[[Configurable]]': true,
		'[[Enumerable]]': true,
		'[[Get]]': true,
		'[[Set]]': true,
		'[[Value]]': true,
		'[[Writable]]': true
	};

	for (var key in Desc) { // eslint-disable-line no-restricted-syntax
		if (src$1(Desc, key) && !allowed[key]) {
			return false;
		}
	}

	if (ES.IsDataDescriptor(Desc) && ES.IsAccessorDescriptor(Desc)) {
		throw new $TypeError$5('Property Descriptors may not be both accessor and data descriptors');
	}
	return true;
};

var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}



var $isEnumerable = callBound('Object.prototype.propertyIsEnumerable');

// eslint-disable-next-line max-params
var DefineOwnProperty = function DefineOwnProperty(IsDataDescriptor, SameValue, FromPropertyDescriptor, O, P, desc) {
	if (!$defineProperty) {
		if (!IsDataDescriptor(desc)) {
			// ES3 does not support getters/setters
			return false;
		}
		if (!desc['[[Configurable]]'] || !desc['[[Writable]]']) {
			return false;
		}

		// fallback for ES3
		if (P in O && $isEnumerable(O, P) !== !!desc['[[Enumerable]]']) {
			// a non-enumerable existing property
			return false;
		}

		// property does not exist at all, or exists but is enumerable
		var V = desc['[[Value]]'];
		// eslint-disable-next-line no-param-reassign
		O[P] = V; // will use [[Define]]
		return SameValue(O[P], V);
	}
	$defineProperty(O, P, FromPropertyDescriptor(desc));
	return true;
};

var $TypeError$6 = GetIntrinsic('%TypeError%');
var $SyntaxError = GetIntrinsic('%SyntaxError%');



var predicates = {
	// https://ecma-international.org/ecma-262/6.0/#sec-property-descriptor-specification-type
	'Property Descriptor': function isPropertyDescriptor(Type, Desc) {
		if (Type(Desc) !== 'Object') {
			return false;
		}
		var allowed = {
			'[[Configurable]]': true,
			'[[Enumerable]]': true,
			'[[Get]]': true,
			'[[Set]]': true,
			'[[Value]]': true,
			'[[Writable]]': true
		};

		for (var key in Desc) { // eslint-disable-line
			if (src$1(Desc, key) && !allowed[key]) {
				return false;
			}
		}

		var isData = src$1(Desc, '[[Value]]');
		var IsAccessor = src$1(Desc, '[[Get]]') || src$1(Desc, '[[Set]]');
		if (isData && IsAccessor) {
			throw new $TypeError$6('Property Descriptors may not be both accessor and data descriptors');
		}
		return true;
	}
};

var assertRecord = function assertRecord(Type, recordType, argumentName, value) {
	var predicate = predicates[recordType];
	if (typeof predicate !== 'function') {
		throw new $SyntaxError('unknown record type: ' + recordType);
	}
	if (!predicate(Type, value)) {
		throw new $TypeError$6(argumentName + ' must be a ' + recordType);
	}
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-frompropertydescriptor

var FromPropertyDescriptor = function FromPropertyDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return Desc;
	}

	assertRecord(Type$1, 'Property Descriptor', 'Desc', Desc);

	var obj = {};
	if ('[[Value]]' in Desc) {
		obj.value = Desc['[[Value]]'];
	}
	if ('[[Writable]]' in Desc) {
		obj.writable = Desc['[[Writable]]'];
	}
	if ('[[Get]]' in Desc) {
		obj.get = Desc['[[Get]]'];
	}
	if ('[[Set]]' in Desc) {
		obj.set = Desc['[[Set]]'];
	}
	if ('[[Enumerable]]' in Desc) {
		obj.enumerable = Desc['[[Enumerable]]'];
	}
	if ('[[Configurable]]' in Desc) {
		obj.configurable = Desc['[[Configurable]]'];
	}
	return obj;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isaccessordescriptor

var IsAccessorDescriptor = function IsAccessorDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$1, 'Property Descriptor', 'Desc', Desc);

	if (!src$1(Desc, '[[Get]]') && !src$1(Desc, '[[Set]]')) {
		return false;
	}

	return true;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isdatadescriptor

var IsDataDescriptor = function IsDataDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$1, 'Property Descriptor', 'Desc', Desc);

	if (!src$1(Desc, '[[Value]]') && !src$1(Desc, '[[Writable]]')) {
		return false;
	}

	return true;
};

var _isNaN = Number.isNaN || function isNaN(a) {
	return a !== a;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.12

var SameValue = function SameValue(x, y) {
	if (x === y) { // 0 === -0, but they are not identical.
		if (x === 0) { return 1 / x === 1 / y; }
		return true;
	}
	return _isNaN(x) && _isNaN(y);
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.2

var ToBoolean = function ToBoolean(value) { return !!value; };

var fnToStr = Function.prototype.toString;
var reflectApply = typeof Reflect === 'object' && Reflect !== null && Reflect.apply;
var badArrayLike;
var isCallableMarker;
if (typeof reflectApply === 'function' && typeof Object.defineProperty === 'function') {
	try {
		badArrayLike = Object.defineProperty({}, 'length', {
			get: function () {
				throw isCallableMarker;
			}
		});
		isCallableMarker = {};
	} catch (_) {
		reflectApply = null;
	}
} else {
	reflectApply = null;
}

var constructorRegex = /^\s*class\b/;
var isES6ClassFn = function isES6ClassFunction(value) {
	try {
		var fnStr = fnToStr.call(value);
		return constructorRegex.test(fnStr);
	} catch (e) {
		return false; // not a function
	}
};

var tryFunctionObject = function tryFunctionToStr(value) {
	try {
		if (isES6ClassFn(value)) { return false; }
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr$8 = Object.prototype.toString;
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var hasToStringTag$2 = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

var isCallable = reflectApply
	? function isCallable(value) {
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (typeof value === 'function' && !value.prototype) { return true; }
		try {
			reflectApply(value, null, badArrayLike);
		} catch (e) {
			if (e !== isCallableMarker) { return false; }
		}
		return !isES6ClassFn(value);
	}
	: function isCallable(value) {
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (typeof value === 'function' && !value.prototype) { return true; }
		if (hasToStringTag$2) { return tryFunctionObject(value); }
		if (isES6ClassFn(value)) { return false; }
		var strClass = toStr$8.call(value);
		return strClass === fnClass || strClass === genClass;
	};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.11

var IsCallable = isCallable;

var $TypeError$7 = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/5.1/#sec-8.10.5

var ToPropertyDescriptor = function ToPropertyDescriptor(Obj) {
	if (Type$1(Obj) !== 'Object') {
		throw new $TypeError$7('ToPropertyDescriptor requires an object');
	}

	var desc = {};
	if (src$1(Obj, 'enumerable')) {
		desc['[[Enumerable]]'] = ToBoolean(Obj.enumerable);
	}
	if (src$1(Obj, 'configurable')) {
		desc['[[Configurable]]'] = ToBoolean(Obj.configurable);
	}
	if (src$1(Obj, 'value')) {
		desc['[[Value]]'] = Obj.value;
	}
	if (src$1(Obj, 'writable')) {
		desc['[[Writable]]'] = ToBoolean(Obj.writable);
	}
	if (src$1(Obj, 'get')) {
		var getter = Obj.get;
		if (typeof getter !== 'undefined' && !IsCallable(getter)) {
			throw new TypeError('getter must be a function');
		}
		desc['[[Get]]'] = getter;
	}
	if (src$1(Obj, 'set')) {
		var setter = Obj.set;
		if (typeof setter !== 'undefined' && !IsCallable(setter)) {
			throw new $TypeError$7('setter must be a function');
		}
		desc['[[Set]]'] = setter;
	}

	if ((src$1(desc, '[[Get]]') || src$1(desc, '[[Set]]')) && (src$1(desc, '[[Value]]') || src$1(desc, '[[Writable]]'))) {
		throw new $TypeError$7('Invalid property descriptor. Cannot both specify accessors and a value or writable attribute');
	}
	return desc;
};

var $TypeError$8 = GetIntrinsic('%TypeError%');












// https://www.ecma-international.org/ecma-262/6.0/#sec-definepropertyorthrow

var DefinePropertyOrThrow = function DefinePropertyOrThrow(O, P, desc) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$8('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey(P)) {
		throw new $TypeError$8('Assertion failed: IsPropertyKey(P) is not true');
	}

	var Desc = isPropertyDescriptor({
		Type: Type$1,
		IsDataDescriptor: IsDataDescriptor,
		IsAccessorDescriptor: IsAccessorDescriptor
	}, desc) ? desc : ToPropertyDescriptor(desc);
	if (!isPropertyDescriptor({
		Type: Type$1,
		IsDataDescriptor: IsDataDescriptor,
		IsAccessorDescriptor: IsAccessorDescriptor
	}, Desc)) {
		throw new $TypeError$8('Assertion failed: Desc is not a valid Property Descriptor');
	}

	return DefineOwnProperty(
		IsDataDescriptor,
		SameValue,
		FromPropertyDescriptor,
		O,
		P,
		Desc
	);
};

var IsConstructor = createCommonjsModule(function (module) {



var $construct = GetIntrinsic('%Reflect.construct%', true);

var DefinePropertyOrThrow$1 = DefinePropertyOrThrow;
try {
	DefinePropertyOrThrow$1({}, '', { '[[Get]]': function () {} });
} catch (e) {
	// Accessor properties aren't supported
	DefinePropertyOrThrow$1 = null;
}

// https://www.ecma-international.org/ecma-262/6.0/#sec-isconstructor

if (DefinePropertyOrThrow$1 && $construct) {
	var isConstructorMarker = {};
	var badArrayLike = {};
	DefinePropertyOrThrow$1(badArrayLike, 'length', {
		'[[Get]]': function () {
			throw isConstructorMarker;
		},
		'[[Enumerable]]': true
	});

	module.exports = function IsConstructor(argument) {
		try {
			// `Reflect.construct` invokes `IsConstructor(target)` before `Get(args, 'length')`:
			$construct(argument, badArrayLike);
		} catch (err) {
			return err === isConstructorMarker;
		}
	};
} else {
	module.exports = function IsConstructor(argument) {
		// unfortunately there's no way to truly check this without try/catch `new argument` in old environments
		return typeof argument === 'function' && !!argument.prototype;
	};
}
});

var $isNaN = Number.isNaN || function (a) { return a !== a; };

var _isFinite = Number.isFinite || function (x) { return typeof x === 'number' && !$isNaN(x) && x !== Infinity && x !== -Infinity; };

var $Math = GetIntrinsic('%Math%');

var $floor = $Math.floor;
var $abs = $Math.abs;




// https://www.ecma-international.org/ecma-262/6.0/#sec-isinteger

var IsInteger = function IsInteger(argument) {
	if (typeof argument !== 'number' || _isNaN(argument) || !_isFinite(argument)) {
		return false;
	}
	var abs = $abs(argument);
	return $floor(abs) === abs;
};

var $Array$1 = GetIntrinsic('%Array%');
var $species = GetIntrinsic('%Symbol.species%', true);
var $TypeError$9 = GetIntrinsic('%TypeError%');







// https://ecma-international.org/ecma-262/6.0/#sec-arrayspeciescreate

var ArraySpeciesCreate = function ArraySpeciesCreate(originalArray, length) {
	if (!IsInteger(length) || length < 0) {
		throw new $TypeError$9('Assertion failed: length must be an integer >= 0');
	}
	var len = length === 0 ? 0 : length;
	var C;
	var isArray = IsArray(originalArray);
	if (isArray) {
		C = Get(originalArray, 'constructor');
		// TODO: figure out how to make a cross-realm normal Array, a same-realm Array
		// if (IsConstructor(C)) {
		// 	if C is another realm's Array, C = undefined
		// 	Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(Array))) === null ?
		// }
		if ($species && Type$1(C) === 'Object') {
			C = Get(C, $species);
			if (C === null) {
				C = void 0;
			}
		}
	}
	if (typeof C === 'undefined') {
		return $Array$1(len);
	}
	if (!IsConstructor(C)) {
		throw new $TypeError$9('C must be a constructor');
	}
	return new C(len); // Construct(C, len);
};

var $apply$1 = GetIntrinsic('%Reflect.apply%', true) || callBound('%Function.prototype.apply%');

// https://www.ecma-international.org/ecma-262/6.0/#sec-call

var Call = function Call(F, V) {
	var args = arguments.length > 2 ? arguments[2] : [];
	return $apply$1(F, V, args);
};

var $gOPD$1 = GetIntrinsic('%Object.getOwnPropertyDescriptor%');
if ($gOPD$1) {
	try {
		$gOPD$1([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD$1 = null;
	}
}

var getOwnPropertyDescriptor = $gOPD$1;

var hasSymbols$4 = hasSymbols$2();
var hasToStringTag$3 = hasSymbols$4 && typeof Symbol.toStringTag === 'symbol';
var hasOwnProperty;
var regexExec;
var isRegexMarker;
var badStringifier;

if (hasToStringTag$3) {
	hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
	regexExec = Function.call.bind(RegExp.prototype.exec);
	isRegexMarker = {};

	var throwRegexMarker = function () {
		throw isRegexMarker;
	};
	badStringifier = {
		toString: throwRegexMarker,
		valueOf: throwRegexMarker
	};

	if (typeof Symbol.toPrimitive === 'symbol') {
		badStringifier[Symbol.toPrimitive] = throwRegexMarker;
	}
}

var toStr$9 = Object.prototype.toString;
var gOPD = Object.getOwnPropertyDescriptor;
var regexClass = '[object RegExp]';

var isRegex = hasToStringTag$3
	// eslint-disable-next-line consistent-return
	? function isRegex(value) {
		if (!value || typeof value !== 'object') {
			return false;
		}

		var descriptor = gOPD(value, 'lastIndex');
		var hasLastIndexDataProperty = descriptor && hasOwnProperty(descriptor, 'value');
		if (!hasLastIndexDataProperty) {
			return false;
		}

		try {
			regexExec(value, badStringifier);
		} catch (e) {
			return e === isRegexMarker;
		}
	}
	: function isRegex(value) {
		// In older browsers, typeof regex incorrectly returns 'function'
		if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
			return false;
		}

		return toStr$9.call(value) === regexClass;
	};

var $match = GetIntrinsic('%Symbol.match%', true);





// https://ecma-international.org/ecma-262/6.0/#sec-isregexp

var IsRegExp = function IsRegExp(argument) {
	if (!argument || typeof argument !== 'object') {
		return false;
	}
	if ($match) {
		var isRegExp = argument[$match];
		if (typeof isRegExp !== 'undefined') {
			return ToBoolean(isRegExp);
		}
	}
	return isRegex(argument);
};

var $TypeError$a = GetIntrinsic('%TypeError%');



var $isEnumerable$1 = callBound('Object.prototype.propertyIsEnumerable');









// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinarygetownproperty

var OrdinaryGetOwnProperty = function OrdinaryGetOwnProperty(O, P) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$a('Assertion failed: O must be an Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$a('Assertion failed: P must be a Property Key');
	}
	if (!src$1(O, P)) {
		return void 0;
	}
	if (!getOwnPropertyDescriptor) {
		// ES3 / IE 8 fallback
		var arrayLength = IsArray(O) && P === 'length';
		var regexLastIndex = IsRegExp(O) && P === 'lastIndex';
		return {
			'[[Configurable]]': !(arrayLength || regexLastIndex),
			'[[Enumerable]]': $isEnumerable$1(O, P),
			'[[Value]]': O[P],
			'[[Writable]]': true
		};
	}
	return ToPropertyDescriptor(getOwnPropertyDescriptor(O, P));
};

var isPrimitive = function isPrimitive(value) {
	return value === null || (typeof value !== 'function' && typeof value !== 'object');
};

var $Object = GetIntrinsic('%Object%');



var $preventExtensions = $Object.preventExtensions;
var $isExtensible = $Object.isExtensible;

// https://www.ecma-international.org/ecma-262/6.0/#sec-isextensible-o

var IsExtensible = $preventExtensions
	? function IsExtensible(obj) {
		return !isPrimitive(obj) && $isExtensible(obj);
	}
	: function IsExtensible(obj) {
		return !isPrimitive(obj);
	};

var $TypeError$b = GetIntrinsic('%TypeError%');











// https://www.ecma-international.org/ecma-262/6.0/#sec-createdataproperty

var CreateDataProperty = function CreateDataProperty(O, P, V) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$b('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$b('Assertion failed: IsPropertyKey(P) is not true');
	}
	var oldDesc = OrdinaryGetOwnProperty(O, P);
	var extensible = !oldDesc || IsExtensible(O);
	var immutable = oldDesc && (!oldDesc['[[Writable]]'] || !oldDesc['[[Configurable]]']);
	if (immutable || !extensible) {
		return false;
	}
	return DefineOwnProperty(
		IsDataDescriptor,
		SameValue,
		FromPropertyDescriptor,
		O,
		P,
		{
			'[[Configurable]]': true,
			'[[Enumerable]]': true,
			'[[Value]]': V,
			'[[Writable]]': true
		}
	);
};

var $TypeError$c = GetIntrinsic('%TypeError%');





// // https://ecma-international.org/ecma-262/6.0/#sec-createdatapropertyorthrow

var CreateDataPropertyOrThrow = function CreateDataPropertyOrThrow(O, P, V) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$c('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$c('Assertion failed: IsPropertyKey(P) is not true');
	}
	var success = CreateDataProperty(O, P, V);
	if (!success) {
		throw new $TypeError$c('unable to create data property');
	}
	return success;
};

var $TypeError$d = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-hasproperty

var HasProperty = function HasProperty(O, P) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$d('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$d('Assertion failed: `P` must be a Property Key');
	}
	return P in O;
};

var $test = GetIntrinsic('RegExp.prototype.test');



var regexTester = function regexTester(regex) {
	return callBind($test, regex);
};

var isPrimitive$1 = function isPrimitive(value) {
	return value === null || (typeof value !== 'function' && typeof value !== 'object');
};

var getDay = Date.prototype.getDay;
var tryDateObject = function tryDateGetDayCall(value) {
	try {
		getDay.call(value);
		return true;
	} catch (e) {
		return false;
	}
};

var toStr$a = Object.prototype.toString;
var dateClass = '[object Date]';
var hasToStringTag$4 = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

var isDateObject = function isDateObject(value) {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	return hasToStringTag$4 ? tryDateObject(value) : toStr$a.call(value) === dateClass;
};

var isSymbol$1 = createCommonjsModule(function (module) {

var toStr = Object.prototype.toString;
var hasSymbols = hasSymbols$2();

if (hasSymbols) {
	var symToStr = Symbol.prototype.toString;
	var symStringRegex = /^Symbol\(.*\)$/;
	var isSymbolObject = function isRealSymbolObject(value) {
		if (typeof value.valueOf() !== 'symbol') {
			return false;
		}
		return symStringRegex.test(symToStr.call(value));
	};

	module.exports = function isSymbol(value) {
		if (typeof value === 'symbol') {
			return true;
		}
		if (toStr.call(value) !== '[object Symbol]') {
			return false;
		}
		try {
			return isSymbolObject(value);
		} catch (e) {
			return false;
		}
	};
} else {

	module.exports = function isSymbol(value) {
		// this environment does not support Symbols.
		return false ;
	};
}
});

var hasSymbols$5 = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol';






var ordinaryToPrimitive = function OrdinaryToPrimitive(O, hint) {
	if (typeof O === 'undefined' || O === null) {
		throw new TypeError('Cannot call method on ' + O);
	}
	if (typeof hint !== 'string' || (hint !== 'number' && hint !== 'string')) {
		throw new TypeError('hint must be "string" or "number"');
	}
	var methodNames = hint === 'string' ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
	var method, result, i;
	for (i = 0; i < methodNames.length; ++i) {
		method = O[methodNames[i]];
		if (isCallable(method)) {
			result = method.call(O);
			if (isPrimitive$1(result)) {
				return result;
			}
		}
	}
	throw new TypeError('No default value');
};

var GetMethod = function GetMethod(O, P) {
	var func = O[P];
	if (func !== null && typeof func !== 'undefined') {
		if (!isCallable(func)) {
			throw new TypeError(func + ' returned for property ' + P + ' of object ' + O + ' is not a function');
		}
		return func;
	}
	return void 0;
};

// http://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive
var es2015 = function ToPrimitive(input) {
	if (isPrimitive$1(input)) {
		return input;
	}
	var hint = 'default';
	if (arguments.length > 1) {
		if (arguments[1] === String) {
			hint = 'string';
		} else if (arguments[1] === Number) {
			hint = 'number';
		}
	}

	var exoticToPrim;
	if (hasSymbols$5) {
		if (Symbol.toPrimitive) {
			exoticToPrim = GetMethod(input, Symbol.toPrimitive);
		} else if (isSymbol$1(input)) {
			exoticToPrim = Symbol.prototype.valueOf;
		}
	}
	if (typeof exoticToPrim !== 'undefined') {
		var result = exoticToPrim.call(input, hint);
		if (isPrimitive$1(result)) {
			return result;
		}
		throw new TypeError('unable to convert exotic object to primitive');
	}
	if (hint === 'default' && (isDateObject(input) || isSymbol$1(input))) {
		hint = 'string';
	}
	return ordinaryToPrimitive(input, hint === 'default' ? 'number' : hint);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive

var ToPrimitive = function ToPrimitive(input) {
	if (arguments.length > 1) {
		return es2015(input, arguments[1]);
	}
	return es2015(input);
};

var $TypeError$e = GetIntrinsic('%TypeError%');
var $Number = GetIntrinsic('%Number%');
var $RegExp = GetIntrinsic('%RegExp%');
var $parseInteger = GetIntrinsic('%parseInt%');





var $strSlice = callBound('String.prototype.slice');
var isBinary = regexTester(/^0b[01]+$/i);
var isOctal = regexTester(/^0o[0-7]+$/i);
var isInvalidHexLiteral = regexTester(/^[-+]0x[0-9a-f]+$/i);
var nonWS = ['\u0085', '\u200b', '\ufffe'].join('');
var nonWSregex = new $RegExp('[' + nonWS + ']', 'g');
var hasNonWS = regexTester(nonWSregex);

// whitespace from: https://es5.github.io/#x15.5.4.20
// implementation from https://github.com/es-shims/es5-shim/blob/v3.4.0/es5-shim.js#L1304-L1324
var ws = [
	'\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003',
	'\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028',
	'\u2029\uFEFF'
].join('');
var trimRegex = new RegExp('(^[' + ws + ']+)|([' + ws + ']+$)', 'g');
var $replace$1 = callBound('String.prototype.replace');
var $trim = function (value) {
	return $replace$1(value, trimRegex, '');
};



// https://www.ecma-international.org/ecma-262/6.0/#sec-tonumber

var ToNumber = function ToNumber(argument) {
	var value = isPrimitive(argument) ? argument : ToPrimitive(argument, $Number);
	if (typeof value === 'symbol') {
		throw new $TypeError$e('Cannot convert a Symbol value to a number');
	}
	if (typeof value === 'string') {
		if (isBinary(value)) {
			return ToNumber($parseInteger($strSlice(value, 2), 2));
		} else if (isOctal(value)) {
			return ToNumber($parseInteger($strSlice(value, 2), 8));
		} else if (hasNonWS(value) || isInvalidHexLiteral(value)) {
			return NaN;
		} else {
			var trimmed = $trim(value);
			if (trimmed !== value) {
				return ToNumber(trimmed);
			}
		}
	}
	return $Number(value);
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.6

var ToUint32 = function ToUint32(x) {
	return ToNumber(x) >>> 0;
};

var $Object$1 = GetIntrinsic('%Object%');



// https://www.ecma-international.org/ecma-262/6.0/#sec-toobject

var ToObject = function ToObject(value) {
	RequireObjectCoercible(value);
	return $Object$1(value);
};

var $String = GetIntrinsic('%String%');
var $TypeError$f = GetIntrinsic('%TypeError%');

// https://www.ecma-international.org/ecma-262/6.0/#sec-tostring

var ToString = function ToString(argument) {
	if (typeof argument === 'symbol') {
		throw new $TypeError$f('Cannot convert a Symbol value to a string');
	}
	return $String(argument);
};

// Check failure of by-index access of string characters (IE < 9) and failure of `0 in boxedString` (Rhino)
var boxedString = Object('a');
var splitString = boxedString[0] !== 'a' || !(0 in boxedString);

var strSplit = callBound('String.prototype.split');

var implementation$3 = function map(callbackfn) {
	var O = ToObject(this);
	var self = splitString && isString$1(O) ? strSplit(O, '') : O;
	var len = ToUint32(self.length);

	// If no callback function or if callback is not a callable function
	if (!IsCallable(callbackfn)) {
		throw new TypeError('Array.prototype.map callback must be a function');
	}

	var T;
	if (arguments.length > 1) {
		T = arguments[1];
	}

	var A = ArraySpeciesCreate(O, len);
	var k = 0;
	while (k < len) {
		var Pk = ToString(k);
		var kPresent = HasProperty(O, Pk);
		if (kPresent) {
			var kValue = Get(O, Pk);
			var mappedValue = Call(callbackfn, T, [kValue, k, O]);
			CreateDataPropertyOrThrow(A, Pk, mappedValue);
		}
		k += 1;
	}

	return A;
};

var esArrayMethodBoxesProperly = function properlyBoxed(method) {
	// Check node 0.6.21 bug where third parameter is not boxed
	var properlyBoxesNonStrict = true;
	var properlyBoxesStrict = true;
	var threwException = false;
	if (typeof method === 'function') {
		try {
			// eslint-disable-next-line max-params
			method.call('f', function (_, __, O) {
				if (typeof O !== 'object') {
					properlyBoxesNonStrict = false;
				}
			});

			method.call(
				[null],
				function () {
					'use strict';

					properlyBoxesStrict = typeof this === 'string'; // eslint-disable-line no-invalid-this
				},
				'x'
			);
		} catch (e) {
			threwException = true;
		}
		return !threwException && properlyBoxesNonStrict && properlyBoxesStrict;
	}
	return false;
};

var polyfill$2 = function getPolyfill() {
	var method = Array.prototype.map;
	return esArrayMethodBoxesProperly(method) ? method : implementation$3;
};

var shim$1 = function shimArrayPrototypeMap() {
	var polyfill = polyfill$2();
	defineProperties_1(
		Array.prototype,
		{ map: polyfill },
		{ map: function () { return Array.prototype.map !== polyfill; } }
	);
	return polyfill;
};

var polyfill$3 = polyfill$2();


var $slice = callBound('Array.prototype.slice');

// eslint-disable-next-line no-unused-vars
var boundMapShim = function map(array, callbackfn) {
	RequireObjectCoercible(array);
	return polyfill$3.apply(array, $slice(arguments, 1));
};
defineProperties_1(boundMapShim, {
	getPolyfill: polyfill$2,
	implementation: implementation$3,
	shim: shim$1
});

var array_prototype_map = boundMapShim;

requirePromise();








var all = functionBind.call(Function.call, GetIntrinsic('%Promise_all%'));
var reject = functionBind.call(Function.call, GetIntrinsic('%Promise_reject%'));

var implementation$4 = function allSettled(iterable) {
	var C = this;
	if (Type$1(C) !== 'Object') {
		throw new TypeError('`this` value must be an object');
	}
	var values = iterateValue(iterable);
	return all(C, array_prototype_map(values, function (item) {
		var onFulfill = function (value) {
			return { status: 'fulfilled', value: value };
		};
		var onReject = function (reason) {
			return { status: 'rejected', reason: reason };
		};
		var itemPromise = PromiseResolve(C, item);
		try {
			return itemPromise.then(onFulfill, onReject);
		} catch (e) {
			return reject(C, e);
		}
	}));
};

var polyfill$4 = function getPolyfill() {
	requirePromise();
	return typeof Promise.allSettled === 'function' ? Promise.allSettled : implementation$4;
};

var shim$2 = function shimAllSettled() {
	requirePromise();

	var polyfill = polyfill$4();
	defineProperties_1(Promise, { allSettled: polyfill }, {
		allSettled: function testAllSettled() {
			return Promise.allSettled !== polyfill;
		}
	});
	return polyfill;
};

requirePromise();
var bound = functionBind.call(Function.call, polyfill$4());

var rebindable = function allSettled(iterable) {
	// eslint-disable-next-line no-invalid-this
	return bound(typeof this === 'undefined' ? Promise : this, iterable);
};

defineProperties_1(rebindable, {
	getPolyfill: polyfill$4,
	implementation: implementation$4,
	shim: shim$2
});

var promise_allsettled = rebindable;

var randombytes = crypto.randomBytes;

// Generate an internal UID to make the regexp pattern harder to guess.
var UID_LENGTH          = 16;
var UID                 = generateUID();
var PLACE_HOLDER_REGEXP = new RegExp('(\\\\)?"@__(F|R|D|M|S|U|I|B)-' + UID + '-(\\d+)__@"', 'g');

var IS_NATIVE_CODE_REGEXP = /\{\s*\[native code\]\s*\}/g;
var IS_PURE_FUNCTION = /function.*?\(/;
var IS_ARROW_FUNCTION = /.*?=>.*?/;
var UNSAFE_CHARS_REGEXP   = /[<>\/\u2028\u2029]/g;

var RESERVED_SYMBOLS = ['*', 'async'];

// Mapping of unsafe HTML and invalid JavaScript line terminator chars to their
// Unicode char counterparts which are safe to use in JavaScript strings.
var ESCAPED_CHARS = {
    '<'     : '\\u003C',
    '>'     : '\\u003E',
    '/'     : '\\u002F',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
};

function escapeUnsafeChars(unsafeChar) {
    return ESCAPED_CHARS[unsafeChar];
}

function generateUID() {
    var bytes = randombytes(UID_LENGTH);
    var result = '';
    for(var i=0; i<UID_LENGTH; ++i) {
        result += bytes[i].toString(16);
    }
    return result;
}

function deleteFunctions(obj){
    var functionKeys = [];
    for (var key in obj) {
        if (typeof obj[key] === "function") {
            functionKeys.push(key);
        }
    }
    for (var i = 0; i < functionKeys.length; i++) {
        delete obj[functionKeys[i]];
    }
}

var serializeJavascript = function serialize(obj, options) {
    options || (options = {});

    // Backwards-compatibility for `space` as the second argument.
    if (typeof options === 'number' || typeof options === 'string') {
        options = {space: options};
    }

    var functions = [];
    var regexps   = [];
    var dates     = [];
    var maps      = [];
    var sets      = [];
    var undefs    = [];
    var infinities= [];
    var bigInts = [];

    // Returns placeholders for functions and regexps (identified by index)
    // which are later replaced by their string representation.
    function replacer(key, value) {

        // For nested function
        if(options.ignoreFunction){
            deleteFunctions(value);
        }

        if (!value && value !== undefined) {
            return value;
        }

        // If the value is an object w/ a toJSON method, toJSON is called before
        // the replacer runs, so we use this[key] to get the non-toJSONed value.
        var origValue = this[key];
        var type = typeof origValue;

        if (type === 'object') {
            if(origValue instanceof RegExp) {
                return '@__R-' + UID + '-' + (regexps.push(origValue) - 1) + '__@';
            }

            if(origValue instanceof Date) {
                return '@__D-' + UID + '-' + (dates.push(origValue) - 1) + '__@';
            }

            if(origValue instanceof Map) {
                return '@__M-' + UID + '-' + (maps.push(origValue) - 1) + '__@';
            }

            if(origValue instanceof Set) {
                return '@__S-' + UID + '-' + (sets.push(origValue) - 1) + '__@';
            }
        }

        if (type === 'function') {
            return '@__F-' + UID + '-' + (functions.push(origValue) - 1) + '__@';
        }

        if (type === 'undefined') {
            return '@__U-' + UID + '-' + (undefs.push(origValue) - 1) + '__@';
        }

        if (type === 'number' && !isNaN(origValue) && !isFinite(origValue)) {
            return '@__I-' + UID + '-' + (infinities.push(origValue) - 1) + '__@';
        }

        if (type === 'bigint') {
            return '@__B-' + UID + '-' + (bigInts.push(origValue) - 1) + '__@';
        }

        return value;
    }

    function serializeFunc(fn) {
      var serializedFn = fn.toString();
      if (IS_NATIVE_CODE_REGEXP.test(serializedFn)) {
          throw new TypeError('Serializing native function: ' + fn.name);
      }

      // pure functions, example: {key: function() {}}
      if(IS_PURE_FUNCTION.test(serializedFn)) {
          return serializedFn;
      }

      // arrow functions, example: arg1 => arg1+5
      if(IS_ARROW_FUNCTION.test(serializedFn)) {
          return serializedFn;
      }

      var argsStartsAt = serializedFn.indexOf('(');
      var def = serializedFn.substr(0, argsStartsAt)
        .trim()
        .split(' ')
        .filter(function(val) { return val.length > 0 });

      var nonReservedSymbols = def.filter(function(val) {
        return RESERVED_SYMBOLS.indexOf(val) === -1
      });

      // enhanced literal objects, example: {key() {}}
      if(nonReservedSymbols.length > 0) {
          return (def.indexOf('async') > -1 ? 'async ' : '') + 'function'
            + (def.join('').indexOf('*') > -1 ? '*' : '')
            + serializedFn.substr(argsStartsAt);
      }

      // arrow functions
      return serializedFn;
    }

    // Check if the parameter is function
    if (options.ignoreFunction && typeof obj === "function") {
        obj = undefined;
    }
    // Protects against `JSON.stringify()` returning `undefined`, by serializing
    // to the literal string: "undefined".
    if (obj === undefined) {
        return String(obj);
    }

    var str;

    // Creates a JSON string representation of the value.
    // NOTE: Node 0.12 goes into slow mode with extra JSON.stringify() args.
    if (options.isJSON && !options.space) {
        str = JSON.stringify(obj);
    } else {
        str = JSON.stringify(obj, options.isJSON ? null : replacer, options.space);
    }

    // Protects against `JSON.stringify()` returning `undefined`, by serializing
    // to the literal string: "undefined".
    if (typeof str !== 'string') {
        return String(str);
    }

    // Replace unsafe HTML and invalid JavaScript line terminator chars with
    // their safe Unicode char counterpart. This _must_ happen before the
    // regexps and functions are serialized and added back to the string.
    if (options.unsafe !== true) {
        str = str.replace(UNSAFE_CHARS_REGEXP, escapeUnsafeChars);
    }

    if (functions.length === 0 && regexps.length === 0 && dates.length === 0 && maps.length === 0 && sets.length === 0 && undefs.length === 0 && infinities.length === 0 && bigInts.length === 0) {
        return str;
    }

    // Replaces all occurrences of function, regexp, date, map and set placeholders in the
    // JSON string with their string representations. If the original value can
    // not be found, then `undefined` is used.
    return str.replace(PLACE_HOLDER_REGEXP, function (match, backSlash, type, valueIndex) {
        // The placeholder may not be preceded by a backslash. This is to prevent
        // replacing things like `"a\"@__R-<UID>-0__@"` and thus outputting
        // invalid JS.
        if (backSlash) {
            return match;
        }

        if (type === 'D') {
            return "new Date(\"" + dates[valueIndex].toISOString() + "\")";
        }

        if (type === 'R') {
            return "new RegExp(" + serialize(regexps[valueIndex].source) + ", \"" + regexps[valueIndex].flags + "\")";
        }

        if (type === 'M') {
            return "new Map(" + serialize(Array.from(maps[valueIndex].entries()), options) + ")";
        }

        if (type === 'S') {
            return "new Set(" + serialize(Array.from(sets[valueIndex].values()), options) + ")";
        }

        if (type === 'U') {
            return 'undefined'
        }

        if (type === 'I') {
            return infinities[valueIndex];
        }

        if (type === 'B') {
            return "BigInt(\"" + bigInts[valueIndex] + "\")";
        }

        var fn = functions[valueIndex];

        return serializeFunc(fn);
    });
};

// source of inspiration: https://github.com/sindresorhus/require-fool-webpack
var requireFoolWebpack = eval(
    'typeof require !== \'undefined\' ' +
    '? require ' +
    ': function (module) { throw new Error(\'Module " + module + " not found.\') }'
);

var requireFoolWebpack_1 = requireFoolWebpack;

var environment = createCommonjsModule(function (module) {
// source: https://github.com/flexdinesh/browser-or-node
var isNode = function (nodeProcess) {
  return (
    typeof nodeProcess !== 'undefined' &&
    nodeProcess.versions != null &&
    nodeProcess.versions.node != null
  );
};
module.exports.isNode = isNode;

// determines the JavaScript platform: browser or node
module.exports.platform = typeof process !== 'undefined' && isNode(process)
  ? 'node'
  : 'browser';

// determines whether the code is running in main thread or not
// note that in node.js we have to check both worker_thread and child_process
var worker_threads = tryRequireFoolWebpack('worker_threads');
module.exports.isMainThread = module.exports.platform === 'node'
  ? ((!worker_threads || worker_threads.isMainThread) && !process.connected)
  : typeof Window !== 'undefined';

// determines the number of cpus available
module.exports.cpus = module.exports.platform === 'browser'
  ? self.navigator.hardwareConcurrency
  : requireFoolWebpack_1('os').cpus().length;

function tryRequireFoolWebpack (module) {
  try {
    return requireFoolWebpack_1(module);
  } catch(err) {
    return null
  }
}
});

/**
 * Promise
 *
 * Inspired by https://gist.github.com/RubaXa/8501359 from RubaXa <trash@rubaxa.org>
 *
 * @param {Function} handler   Called as handler(resolve: Function, reject: Function)
 * @param {Promise} [parent]   Parent promise for propagation of cancel and timeout
 */
function Promise$1(handler, parent) {
  var me = this;

  if (!(this instanceof Promise$1)) {
    throw new SyntaxError('Constructor must be called with the new operator');
  }

  if (typeof handler !== 'function') {
    throw new SyntaxError('Function parameter handler(resolve, reject) missing');
  }

  var _onSuccess = [];
  var _onFail = [];

  // status
  this.resolved = false;
  this.rejected = false;
  this.pending = true;

  /**
   * Process onSuccess and onFail callbacks: add them to the queue.
   * Once the promise is resolve, the function _promise is replace.
   * @param {Function} onSuccess
   * @param {Function} onFail
   * @private
   */
  var _process = function (onSuccess, onFail) {
    _onSuccess.push(onSuccess);
    _onFail.push(onFail);
  };

  /**
   * Add an onSuccess callback and optionally an onFail callback to the Promise
   * @param {Function} onSuccess
   * @param {Function} [onFail]
   * @returns {Promise} promise
   */
  this.then = function (onSuccess, onFail) {
    return new Promise$1(function (resolve, reject) {
      var s = onSuccess ? _then(onSuccess, resolve, reject) : resolve;
      var f = onFail    ? _then(onFail,    resolve, reject) : reject;

      _process(s, f);
    }, me);
  };

  /**
   * Resolve the promise
   * @param {*} result
   * @type {Function}
   */
  var _resolve = function (result) {
    // update status
    me.resolved = true;
    me.rejected = false;
    me.pending = false;

    _onSuccess.forEach(function (fn) {
      fn(result);
    });

    _process = function (onSuccess, onFail) {
      onSuccess(result);
    };

    _resolve = _reject = function () { };

    return me;
  };

  /**
   * Reject the promise
   * @param {Error} error
   * @type {Function}
   */
  var _reject = function (error) {
    // update status
    me.resolved = false;
    me.rejected = true;
    me.pending = false;

    _onFail.forEach(function (fn) {
      fn(error);
    });

    _process = function (onSuccess, onFail) {
      onFail(error);
    };

    _resolve = _reject = function () { };

    return me;
  };

  /**
   * Cancel te promise. This will reject the promise with a CancellationError
   * @returns {Promise} self
   */
  this.cancel = function () {
    if (parent) {
      parent.cancel();
    }
    else {
      _reject(new CancellationError());
    }

    return me;
  };

  /**
   * Set a timeout for the promise. If the promise is not resolved within
   * the time, the promise will be cancelled and a TimeoutError is thrown.
   * If the promise is resolved in time, the timeout is removed.
   * @param {number} delay     Delay in milliseconds
   * @returns {Promise} self
   */
  this.timeout = function (delay) {
    if (parent) {
      parent.timeout(delay);
    }
    else {
      var timer = setTimeout(function () {
        _reject(new TimeoutError('Promise timed out after ' + delay + ' ms'));
      }, delay);

      me.always(function () {
        clearTimeout(timer);
      });
    }

    return me;
  };

  // attach handler passing the resolve and reject functions
  handler(function (result) {
    _resolve(result);
  }, function (error) {
    _reject(error);
  });
}

/**
 * Execute given callback, then call resolve/reject based on the returned result
 * @param {Function} callback
 * @param {Function} resolve
 * @param {Function} reject
 * @returns {Function}
 * @private
 */
function _then(callback, resolve, reject) {
  return function (result) {
    try {
      var res = callback(result);
      if (res && typeof res.then === 'function' && typeof res['catch'] === 'function') {
        // method returned a promise
        res.then(resolve, reject);
      }
      else {
        resolve(res);
      }
    }
    catch (error) {
      reject(error);
    }
  }
}

/**
 * Add an onFail callback to the Promise
 * @param {Function} onFail
 * @returns {Promise} promise
 */
Promise$1.prototype['catch'] = function (onFail) {
  return this.then(null, onFail);
};

// TODO: add support for Promise.catch(Error, callback)
// TODO: add support for Promise.catch(Error, Error, callback)

/**
 * Execute given callback when the promise either resolves or rejects.
 * @param {Function} fn
 * @returns {Promise} promise
 */
Promise$1.prototype.always = function (fn) {
  return this.then(fn, fn);
};

/**
 * Create a promise which resolves when all provided promises are resolved,
 * and fails when any of the promises resolves.
 * @param {Promise[]} promises
 * @returns {Promise} promise
 */
Promise$1.all = function (promises){
  return new Promise$1(function (resolve, reject) {
    var remaining = promises.length,
        results = [];

    if (remaining) {
      promises.forEach(function (p, i) {
        p.then(function (result) {
          results[i] = result;
          remaining--;
          if (remaining == 0) {
            resolve(results);
          }
        }, function (error) {
          remaining = 0;
          reject(error);
        });
      });
    }
    else {
      resolve(results);
    }
  });
};

/**
 * Create a promise resolver
 * @returns {{promise: Promise, resolve: Function, reject: Function}} resolver
 */
Promise$1.defer = function () {
  var resolver = {};

  resolver.promise = new Promise$1(function (resolve, reject) {
    resolver.resolve = resolve;
    resolver.reject = reject;
  });

  return resolver;
};

/**
 * Create a cancellation error
 * @param {String} [message]
 * @extends Error
 */
function CancellationError(message) {
  this.message = message || 'promise cancelled';
  this.stack = (new Error()).stack;
}

CancellationError.prototype = new Error();
CancellationError.prototype.constructor = Error;
CancellationError.prototype.name = 'CancellationError';

Promise$1.CancellationError = CancellationError;


/**
 * Create a timeout error
 * @param {String} [message]
 * @extends Error
 */
function TimeoutError(message) {
  this.message = message || 'timeout exceeded';
  this.stack = (new Error()).stack;
}

TimeoutError.prototype = new Error();
TimeoutError.prototype.constructor = Error;
TimeoutError.prototype.name = 'TimeoutError';

Promise$1.TimeoutError = TimeoutError;


var _Promise = Promise$1;

var embeddedWorker = createCommonjsModule(function (module) {
/**
 * embeddedWorker.js contains an embedded version of worker.js.
 * This file is automatically generated,
 * changes made in this file will be overwritten.
 */
module.exports = "!function(o){var n={};function t(e){if(n[e])return n[e].exports;var r=n[e]={i:e,l:!1,exports:{}};return o[e].call(r.exports,r,r.exports,t),r.l=!0,r.exports}t.m=o,t.c=n,t.d=function(e,r,o){t.o(e,r)||Object.defineProperty(e,r,{enumerable:!0,get:o})},t.r=function(e){\"undefined\"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:\"Module\"}),Object.defineProperty(e,\"__esModule\",{value:!0})},t.t=function(r,e){if(1&e&&(r=t(r)),8&e)return r;if(4&e&&\"object\"==typeof r&&r&&r.__esModule)return r;var o=Object.create(null);if(t.r(o),Object.defineProperty(o,\"default\",{enumerable:!0,value:r}),2&e&&\"string\"!=typeof r)for(var n in r)t.d(o,n,function(e){return r[e]}.bind(null,n));return o},t.n=function(e){var r=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(r,\"a\",r),r},t.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)},t.p=\"\",t(t.s=0)}([function(module,exports,__webpack_require__){var requireFoolWebpack=eval(\"typeof require !== 'undefined' ? require : function (module) { throw new Error('Module \\\" + module + \\\" not found.') }\"),worker={},WorkerThreads,parentPort;if(\"undefined\"!=typeof self&&\"function\"==typeof postMessage&&\"function\"==typeof addEventListener)worker.on=function(e,r){addEventListener(e,function(e){r(e.data)})},worker.send=function(e){postMessage(e)};else{if(\"undefined\"==typeof process)throw new Error(\"Script must be executed as a worker\");try{WorkerThreads=requireFoolWebpack(\"worker_threads\")}catch(e){if(\"object\"!=typeof e||null===e||\"MODULE_NOT_FOUND\"!==e.code)throw e}WorkerThreads&&null!==WorkerThreads.parentPort?(parentPort=WorkerThreads.parentPort,worker.send=parentPort.postMessage.bind(parentPort),worker.on=parentPort.on.bind(parentPort)):(worker.on=process.on.bind(process),worker.send=process.send.bind(process),worker.on(\"disconnect\",function(){process.exit(1)}))}function convertError(o){return Object.getOwnPropertyNames(o).reduce(function(e,r){return Object.defineProperty(e,r,{value:o[r],enumerable:!0})},{})}function isPromise(e){return e&&\"function\"==typeof e.then&&\"function\"==typeof e.catch}worker.methods={},worker.methods.run=function run(fn,args){var f=eval(\"(\"+fn+\")\");return f.apply(f,args)},worker.methods.methods=function(){return Object.keys(worker.methods)},worker.on(\"message\",function(r){try{var e=worker.methods[r.method];if(!e)throw new Error('Unknown method \"'+r.method+'\"');var o=e.apply(e,r.params);isPromise(o)?o.then(function(e){worker.send({id:r.id,result:e,error:null})}).catch(function(e){worker.send({id:r.id,result:null,error:convertError(e)})}):worker.send({id:r.id,result:o,error:null})}catch(e){worker.send({id:r.id,result:null,error:convertError(e)})}}),worker.register=function(e){if(e)for(var r in e)e.hasOwnProperty(r)&&(worker.methods[r]=e[r]);worker.send(\"ready\")},exports.add=worker.register}]);";
});

function ensureWorkerThreads() {
  var WorkerThreads = tryRequireWorkerThreads();
  if (!WorkerThreads) {
    throw new Error('WorkerPool: workerType = \'thread\' is not supported, Node >= 11.7.0 required')
  }

  return WorkerThreads;
}

// check whether Worker is supported by the browser
function ensureWebWorker() {
  // Workaround for a bug in PhantomJS (Or QtWebkit): https://github.com/ariya/phantomjs/issues/14534
  if (typeof Worker !== 'function' && (typeof Worker !== 'object' || typeof Worker.prototype.constructor !== 'function')) {
    throw new Error('WorkerPool: Web Workers not supported');
  }
}

function tryRequireWorkerThreads() {
  try {
    return requireFoolWebpack_1('worker_threads');
  } catch(error) {
    if (typeof error === 'object' && error !== null && error.code === 'MODULE_NOT_FOUND') {
      // no worker_threads available (old version of node.js)
      return null;
    } else {
      throw error;
    }
  }
}

// get the default worker script
function getDefaultWorker() {
  if (environment.platform === 'browser') {
    // test whether the browser supports all features that we need
    if (typeof Blob === 'undefined') {
      throw new Error('Blob not supported by the browser');
    }
    if (!window.URL || typeof window.URL.createObjectURL !== 'function') {
      throw new Error('URL.createObjectURL not supported by the browser');
    }

    // use embedded worker.js
    var blob = new Blob([embeddedWorker], {type: 'text/javascript'});
    return window.URL.createObjectURL(blob);
  }
  else {
    // use external worker.js in current directory
    return __dirname + '/worker.js';
  }
}

function setupWorker(script, options) {
  if (options.workerType === 'web') { // browser only
    ensureWebWorker();
    return setupBrowserWorker(script, Worker);
  } else if (options.workerType === 'thread') { // node.js only
    WorkerThreads = ensureWorkerThreads();
    return setupWorkerThreadWorker(script, WorkerThreads);
  } else if (options.workerType === 'process' || !options.workerType) { // node.js only
    return setupProcessWorker(script, resolveForkOptions(options), requireFoolWebpack_1('child_process'));
  } else { // options.workerType === 'auto' or undefined
    if (environment.platform === 'browser') {
      ensureWebWorker();
      return setupBrowserWorker(script, Worker);
    }
    else { // environment.platform === 'node'
      var WorkerThreads = tryRequireWorkerThreads();
      if (WorkerThreads) {
        return setupWorkerThreadWorker(script, WorkerThreads);
      } else {
        return setupProcessWorker(script, resolveForkOptions(options), requireFoolWebpack_1('child_process'));
      }
    }
  }
}

function setupBrowserWorker(script, Worker) {
  // create the web worker
  var worker = new Worker(script);

  worker.isBrowserWorker = true;
  // add node.js API to the web worker
  worker.on = function (event, callback) {
    this.addEventListener(event, function (message) {
      callback(message.data);
    });
  };
  worker.send = function (message) {
    this.postMessage(message);
  };
  return worker;
}

function setupWorkerThreadWorker(script, WorkerThreads) {
  var worker = new WorkerThreads.Worker(script, {
    stdout: false, // automatically pipe worker.STDOUT to process.STDOUT
    stderr: false  // automatically pipe worker.STDERR to process.STDERR
  });
  worker.isWorkerThread = true;
  // make the worker mimic a child_process
  worker.send = function(message) {
    this.postMessage(message);
  };

  worker.kill = function() {
    this.terminate();
  };

  worker.disconnect = function() {
    this.terminate();
  };

  return worker;
}

function setupProcessWorker(script, options, child_process) {
  // no WorkerThreads, fallback to sub-process based workers
  var worker = child_process.fork(
    script,
    options.forkArgs,
    options.forkOpts
  );

  worker.isChildProcess = true;
  return worker;
}

// add debug flags to child processes if the node inspector is active
function resolveForkOptions(opts) {
  opts = opts || {};

  var processExecArgv = process.execArgv.join(' ');
  var inspectorActive = processExecArgv.indexOf('--inspect') !== -1;
  var debugBrk = processExecArgv.indexOf('--debug-brk') !== -1;

  var execArgv = [];
  if (inspectorActive) {
    execArgv.push('--inspect=' + opts.debugPort);

    if (debugBrk) {
      execArgv.push('--debug-brk');
    }
  }

  process.execArgv.forEach(function(arg) {
    if (arg.indexOf('--max-old-space-size') > -1) {
      execArgv.push(arg);
    }
  });

  return Object.assign({}, opts, {
    forkArgs: opts.forkArgs,
    forkOpts: Object.assign({}, opts.forkOpts, {
      execArgv: (opts.forkOpts && opts.forkOpts.execArgv || [])
      .concat(execArgv)
    })
  });
}

/**
 * Converts a serialized error to Error
 * @param {Object} obj Error that has been serialized and parsed to object
 * @return {Error} The equivalent Error.
 */
function objectToError (obj) {
  var temp = new Error('');
  var props = Object.keys(obj);

  for (var i = 0; i < props.length; i++) {
    temp[props[i]] = obj[props[i]];
  }

  return temp
}

/**
 * A WorkerHandler controls a single worker. This worker can be a child process
 * on node.js or a WebWorker in a browser environment.
 * @param {String} [script] If no script is provided, a default worker with a
 *                          function run will be created.
 * @param {WorkerPoolOptions} _options See docs
 * @constructor
 */
function WorkerHandler(script, _options) {
  var me = this;
  var options = _options || {};

  this.script = script || getDefaultWorker();
  this.worker = setupWorker(this.script, options);
  this.debugPort = options.debugPort;

  // The ready message is only sent if the worker.add method is called (And the default script is not used)
  if (!script) {
    this.worker.ready = true;
  }

  // queue for requests that are received before the worker is ready
  this.requestQueue = [];
  this.worker.on('message', function (response) {
    if (typeof response === 'string' && response === 'ready') {
      me.worker.ready = true;
      dispatchQueuedRequests();
    } else {
      // find the task from the processing queue, and run the tasks callback
      var id = response.id;
      var task = me.processing[id];
      if (task !== undefined) {
        // remove the task from the queue
        delete me.processing[id];

        // test if we need to terminate
        if (me.terminating === true) {
          // complete worker termination if all tasks are finished
          me.terminate();
        }

        // resolve the task's promise
        if (response.error) {
          task.resolver.reject(objectToError(response.error));
        }
        else {
          task.resolver.resolve(response.result);
        }
      }
    }
  });

  // reject all running tasks on worker error
  function onError(error) {
    me.terminated = true;
    if (me.terminating && me.terminationHandler) {
      me.terminationHandler(me);
    }
    me.terminating = false;

    for (var id in me.processing) {
      if (me.processing[id] !== undefined) {
        me.processing[id].resolver.reject(error);
      }
    }
    me.processing = Object.create(null);
  }

  // send all queued requests to worker
  function dispatchQueuedRequests()
  {
    me.requestQueue.forEach(me.worker.send.bind(me.worker));
    me.requestQueue = [];
  }

  var worker = this.worker;
  // listen for worker messages error and exit
  this.worker.on('error', onError);
  this.worker.on('exit', function (exitCode, signalCode) {
    var message = 'Workerpool Worker terminated Unexpectedly\n';

    message += '    exitCode: `' + exitCode + '`\n';
    message += '    signalCode: `' + signalCode + '`\n';

    message += '    workerpool.script: `' +  me.script + '`\n';
    message += '    spawnArgs: `' +  worker.spawnargs + '`\n';
    message += '    spawnfile: `' + worker.spawnfile + '`\n';

    message += '    stdout: `' + worker.stdout + '`\n';
    message += '    stderr: `' + worker.stderr + '`\n';

    onError(new Error(message));
  });

  this.processing = Object.create(null); // queue with tasks currently in progress

  this.terminating = false;
  this.terminated = false;
  this.terminationHandler = null;
  this.lastId = 0;
}

/**
 * Get a list with methods available on the worker.
 * @return {Promise.<String[], Error>} methods
 */
WorkerHandler.prototype.methods = function () {
  return this.exec('methods');
};

/**
 * Execute a method with given parameters on the worker
 * @param {String} method
 * @param {Array} [params]
 * @param {{resolve: Function, reject: Function}} [resolver]
 * @return {Promise.<*, Error>} result
 */
WorkerHandler.prototype.exec = function(method, params, resolver) {
  if (!resolver) {
    resolver = _Promise.defer();
  }

  // generate a unique id for the task
  var id = ++this.lastId;

  // register a new task as being in progress
  this.processing[id] = {
    id: id,
    resolver: resolver
  };

  // build a JSON-RPC request
  var request = {
    id: id,
    method: method,
    params: params
  };

  if (this.terminated) {
    resolver.reject(new Error('Worker is terminated'));
  } else if (this.worker.ready) {
    // send the request to the worker
    this.worker.send(request);
  } else {
    this.requestQueue.push(request);
  }

  // on cancellation, force the worker to terminate
  var me = this;
  resolver.promise
    .catch(function (error) {
      if (error instanceof _Promise.CancellationError || error instanceof _Promise.TimeoutError) {
        // remove this task from the queue. It is already rejected (hence this
        // catch event), and else it will be rejected again when terminating
        delete me.processing[id];

        // terminate worker
        me.terminate(true);
      } else {
        throw error;
      }
    });

  return resolver.promise;
};

/**
 * Test whether the worker is working or not
 * @return {boolean} Returns true if the worker is busy
 */
WorkerHandler.prototype.busy = function () {
  return Object.keys(this.processing).length > 0;
};

/**
 * Terminate the worker.
 * @param {boolean} [force=false]   If false (default), the worker is terminated
 *                                  after finishing all tasks currently in
 *                                  progress. If true, the worker will be
 *                                  terminated immediately.
 * @param {function} [callback=null] If provided, will be called when process terminates.
 */
WorkerHandler.prototype.terminate = function (force, callback) {
  if (force) {
    // cancel all tasks in progress
    for (var id in this.processing) {
      if (this.processing[id] !== undefined) {
        this.processing[id].resolver.reject(new Error('Worker terminated'));
      }
    }
    this.processing = Object.create(null);
  }

  if (typeof callback === 'function') {
    this.terminationHandler = callback;
  }
  if (!this.busy()) {
    // all tasks are finished. kill the worker
    if (this.worker) {
      if (typeof this.worker.kill === 'function') {
        this.worker.kill();  // child process
      }
      else if (typeof this.worker.terminate === 'function') {
        this.worker.terminate(); // web worker
      }
      else {
        throw new Error('Failed to terminate worker');
      }
      this.worker = null;
    }
    this.terminating = false;
    this.terminated = true;
    if (this.terminationHandler) {
      this.terminationHandler(this);
    }
  }
  else {
    // we can't terminate immediately, there are still tasks being executed
    this.terminating = true;
  }
};

/**
 * Terminate the worker, returning a Promise that resolves when the termination has been done.
 * @param {boolean} [force=false]   If false (default), the worker is terminated
 *                                  after finishing all tasks currently in
 *                                  progress. If true, the worker will be
 *                                  terminated immediately.
 * @param {number} [timeout]        If provided and non-zero, worker termination promise will be rejected
 *                                  after timeout if worker process has not been terminated.
 * @return {Promise.<WorkerHandler, Error>}
 */
WorkerHandler.prototype.terminateAndNotify = function (force, timeout) {
  var resolver = _Promise.defer();
  if (timeout) {
    resolver.promise.timeout = timeout;
  }
  this.terminate(force, function(worker) {
    resolver.resolve(worker);
  });
  return resolver.promise;
};

var WorkerHandler_1 = WorkerHandler;
var _tryRequireWorkerThreads = tryRequireWorkerThreads;
var _setupProcessWorker = setupProcessWorker;
var _setupBrowserWorker = setupBrowserWorker;
var _setupWorkerThreadWorker = setupWorkerThreadWorker;
var ensureWorkerThreads_1 = ensureWorkerThreads;
WorkerHandler_1._tryRequireWorkerThreads = _tryRequireWorkerThreads;
WorkerHandler_1._setupProcessWorker = _setupProcessWorker;
WorkerHandler_1._setupBrowserWorker = _setupBrowserWorker;
WorkerHandler_1._setupWorkerThreadWorker = _setupWorkerThreadWorker;
WorkerHandler_1.ensureWorkerThreads = ensureWorkerThreads_1;

var MAX_PORTS = 65535;
var debugPortAllocator = DebugPortAllocator;
function DebugPortAllocator() {
  this.ports = Object.create(null);
  this.length = 0;
}

DebugPortAllocator.prototype.nextAvailableStartingAt = function(starting) {
  while (this.ports[starting] === true) {
    starting++;
  }

  if (starting >= MAX_PORTS) {
    throw new Error('WorkerPool debug port limit reached: ' + starting + '>= ' + MAX_PORTS );
  }

  this.ports[starting] = true;
  this.length++;
  return starting;
};

DebugPortAllocator.prototype.releasePort = function(port) {
  delete this.ports[port];
  this.length--;
};

var DEBUG_PORT_ALLOCATOR = new debugPortAllocator();
/**
 * A pool to manage workers
 * @param {String} [script]   Optional worker script
 * @param {WorkerPoolOptions} [options]  See docs
 * @constructor
 */
function Pool(script, options) {
  if (typeof script === 'string') {
    this.script = script || null;
  }
  else {
    this.script = null;
    options = script;
  }

  this.workers = [];  // queue with all workers
  this.tasks = [];    // queue with tasks awaiting execution

  options = options || {};

  this.forkArgs = options.forkArgs || [];
  this.forkOpts = options.forkOpts || {};
  this.debugPortStart = (options.debugPortStart || 43210);
  this.nodeWorker = options.nodeWorker;
  this.workerType = options.workerType || options.nodeWorker || 'auto';
  this.maxQueueSize = options.maxQueueSize || Infinity;

  // configuration
  if (options && 'maxWorkers' in options) {
    validateMaxWorkers(options.maxWorkers);
    this.maxWorkers = options.maxWorkers;
  }
  else {
    this.maxWorkers = Math.max((environment.cpus || 4) - 1, 1);
  }

  if (options && 'minWorkers' in options) {
    if(options.minWorkers === 'max') {
      this.minWorkers = this.maxWorkers;
    } else {
      validateMinWorkers(options.minWorkers);
      this.minWorkers = options.minWorkers;
      this.maxWorkers = Math.max(this.minWorkers, this.maxWorkers);     // in case minWorkers is higher than maxWorkers
    }
    this._ensureMinWorkers();
  }

  this._boundNext = this._next.bind(this);


  if (this.workerType === 'thread') {
    WorkerHandler_1.ensureWorkerThreads();
  }
}


/**
 * Execute a function on a worker.
 *
 * Example usage:
 *
 *   var pool = new Pool()
 *
 *   // call a function available on the worker
 *   pool.exec('fibonacci', [6])
 *
 *   // offload a function
 *   function add(a, b) {
 *     return a + b
 *   };
 *   pool.exec(add, [2, 4])
 *       .then(function (result) {
 *         console.log(result); // outputs 6
 *       })
 *       .catch(function(error) {
 *         console.log(error);
 *       });
 *
 * @param {String | Function} method  Function name or function.
 *                                    If `method` is a string, the corresponding
 *                                    method on the worker will be executed
 *                                    If `method` is a Function, the function
 *                                    will be stringified and executed via the
 *                                    workers built-in function `run(fn, args)`.
 * @param {Array} [params]  Function arguments applied when calling the function
 * @return {Promise.<*, Error>} result
 */
Pool.prototype.exec = function (method, params) {
  // validate type of arguments
  if (params && !Array.isArray(params)) {
    throw new TypeError('Array expected as argument "params"');
  }

  if (typeof method === 'string') {
    var resolver = _Promise.defer();

    if (this.tasks.length >= this.maxQueueSize) {
      throw new Error('Max queue size of ' + this.maxQueueSize + ' reached');
    }

    // add a new task to the queue
    var tasks = this.tasks;
    var task = {
      method:  method,
      params:  params,
      resolver: resolver,
      timeout: null
    };
    tasks.push(task);

    // replace the timeout method of the Promise with our own,
    // which starts the timer as soon as the task is actually started
    var originalTimeout = resolver.promise.timeout;
    resolver.promise.timeout = function timeout (delay) {
      if (tasks.indexOf(task) !== -1) {
        // task is still queued -> start the timer later on
        task.timeout = delay;
        return resolver.promise;
      }
      else {
        // task is already being executed -> start timer immediately
        return originalTimeout.call(resolver.promise, delay);
      }
    };

    // trigger task execution
    this._next();

    return resolver.promise;
  }
  else if (typeof method === 'function') {
    // send stringified function and function arguments to worker
    return this.exec('run', [String(method), params]);
  }
  else {
    throw new TypeError('Function or string expected as argument "method"');
  }
};

/**
 * Create a proxy for current worker. Returns an object containing all
 * methods available on the worker. The methods always return a promise.
 *
 * @return {Promise.<Object, Error>} proxy
 */
Pool.prototype.proxy = function () {
  if (arguments.length > 0) {
    throw new Error('No arguments expected');
  }

  var pool = this;
  return this.exec('methods')
      .then(function (methods) {
        var proxy = {};

        methods.forEach(function (method) {
          proxy[method] = function () {
            return pool.exec(method, Array.prototype.slice.call(arguments));
          };
        });

        return proxy;
      });
};

/**
 * Creates new array with the results of calling a provided callback function
 * on every element in this array.
 * @param {Array} array
 * @param {function} callback  Function taking two arguments:
 *                             `callback(currentValue, index)`
 * @return {Promise.<Array>} Returns a promise which resolves  with an Array
 *                           containing the results of the callback function
 *                           executed for each of the array elements.
 */
/* TODO: implement map
Pool.prototype.map = function (array, callback) {
};
*/

/**
 * Grab the first task from the queue, find a free worker, and assign the
 * worker to the task.
 * @protected
 */
Pool.prototype._next = function () {
  if (this.tasks.length > 0) {
    // there are tasks in the queue

    // find an available worker
    var worker = this._getWorker();
    if (worker) {
      // get the first task from the queue
      var me = this;
      var task = this.tasks.shift();

      // check if the task is still pending (and not cancelled -> promise rejected)
      if (task.resolver.promise.pending) {
        // send the request to the worker
        var promise = worker.exec(task.method, task.params, task.resolver)
          .then(me._boundNext)
          .catch(function () {
            // if the worker crashed and terminated, remove it from the pool
            if (worker.terminated) {
              me._removeWorker(worker);
              // If minWorkers set, spin up new workers to replace the crashed ones
              me._ensureMinWorkers();
            }
            me._next(); // trigger next task in the queue
          });

        // start queued timer now
        if (typeof task.timeout === 'number') {
          promise.timeout(task.timeout);
        }
      } else {
        // The task taken was already complete (either rejected or resolved), so just trigger next task in the queue
        me._next();
      }
    }
  }
};

/**
 * Get an available worker. If no worker is available and the maximum number
 * of workers isn't yet reached, a new worker will be created and returned.
 * If no worker is available and the maximum number of workers is reached,
 * null will be returned.
 *
 * @return {WorkerHandler | null} worker
 * @private
 */
Pool.prototype._getWorker = function() {
  // find a non-busy worker
  var workers = this.workers;
  for (var i = 0; i < workers.length; i++) {
    var worker = workers[i];
    if (worker.busy() === false) {
      return worker;
    }
  }

  if (workers.length < this.maxWorkers) {
    // create a new worker
    worker = this._createWorkerHandler();
    workers.push(worker);
    return worker;
  }

  return null;
};

/**
 * Remove a worker from the pool. For example after a worker terminated for
 * whatever reason
 * @param {WorkerHandler} worker
 * @protected
 */
Pool.prototype._removeWorker = function(worker) {
  DEBUG_PORT_ALLOCATOR.releasePort(worker.debugPort);
  // terminate the worker (if not already terminated)
  worker.terminate();
  this._removeWorkerFromList(worker);
};

/**
 * Remove a worker from the pool list.
 * @param {WorkerHandler} worker
 * @protected
 */
Pool.prototype._removeWorkerFromList = function(worker) {
  // remove from the list with workers
  var index = this.workers.indexOf(worker);
  if (index !== -1) {
    this.workers.splice(index, 1);
  }
};

/**
 * Close all active workers. Tasks currently being executed will be finished first.
 * @param {boolean} [force=false]   If false (default), the workers are terminated
 *                                  after finishing all tasks currently in
 *                                  progress. If true, the workers will be
 *                                  terminated immediately.
 * @param {number} [timeout]        If provided and non-zero, worker termination promise will be rejected
 *                                  after timeout if worker process has not been terminated.
 * @return {Promise.<void, Error>}
 */
Pool.prototype.terminate = function (force, timeout) {
  // cancel any pending tasks
  this.tasks.forEach(function (task) {
    task.resolver.reject(new Error('Pool terminated'));
  });
  this.tasks.length = 0;

  var f = function (worker) {
    this._removeWorkerFromList(worker);
  };
  var removeWorker = f.bind(this);

  var promises = [];
  var workers = this.workers.slice();
  workers.forEach(function (worker) {
    var termPromise = worker.terminateAndNotify(force, timeout)
      .then(removeWorker);
    promises.push(termPromise);
  });
  return _Promise.all(promises);
};

/**
 * Retrieve statistics on tasks and workers.
 * @return {{totalWorkers: number, busyWorkers: number, idleWorkers: number, pendingTasks: number, activeTasks: number}} Returns an object with statistics
 */
Pool.prototype.stats = function () {
  var totalWorkers = this.workers.length;
  var busyWorkers = this.workers.filter(function (worker) {
    return worker.busy();
  }).length;

  return {
    totalWorkers:  totalWorkers,
    busyWorkers:   busyWorkers,
    idleWorkers:   totalWorkers - busyWorkers,

    pendingTasks:  this.tasks.length,
    activeTasks:   busyWorkers
  };
};

/**
 * Ensures that a minimum of minWorkers is up and running
 * @protected
 */
Pool.prototype._ensureMinWorkers = function() {
  if (this.minWorkers) {
    for(var i = this.workers.length; i < this.minWorkers; i++) {
      this.workers.push(this._createWorkerHandler());
    }
  }
};

/**
 * Helper function to create a new WorkerHandler and pass all options.
 * @return {WorkerHandler}
 * @private
 */
Pool.prototype._createWorkerHandler = function () {
  return new WorkerHandler_1(this.script, {
    forkArgs: this.forkArgs,
    forkOpts: this.forkOpts,
    debugPort: DEBUG_PORT_ALLOCATOR.nextAvailableStartingAt(this.debugPortStart),
    workerType: this.workerType
  });
};

/**
 * Ensure that the maxWorkers option is an integer >= 1
 * @param {*} maxWorkers
 * @returns {boolean} returns true maxWorkers has a valid value
 */
function validateMaxWorkers(maxWorkers) {
  if (!isNumber$1(maxWorkers) || !isInteger(maxWorkers) || maxWorkers < 1) {
    throw new TypeError('Option maxWorkers must be an integer number >= 1');
  }
}

/**
 * Ensure that the minWorkers option is an integer >= 0
 * @param {*} minWorkers
 * @returns {boolean} returns true when minWorkers has a valid value
 */
function validateMinWorkers(minWorkers) {
  if (!isNumber$1(minWorkers) || !isInteger(minWorkers) || minWorkers < 0) {
    throw new TypeError('Option minWorkers must be an integer number >= 0');
  }
}

/**
 * Test whether a variable is a number
 * @param {*} value
 * @returns {boolean} returns true when value is a number
 */
function isNumber$1(value) {
  return typeof value === 'number';
}

/**
 * Test whether a number is an integer
 * @param {number} value
 * @returns {boolean} Returns true if value is an integer
 */
function isInteger(value) {
  return Math.round(value) == value;
}

var Pool_1 = Pool;

var worker_1 = createCommonjsModule(function (module, exports) {
/**
 * worker must be started as a child process or a web worker.
 * It listens for RPC messages from the parent process.
 */

// source of inspiration: https://github.com/sindresorhus/require-fool-webpack
var requireFoolWebpack = eval(
    'typeof require !== \'undefined\'' +
    ' ? require' +
    ' : function (module) { throw new Error(\'Module " + module + " not found.\') }'
);

// create a worker API for sending and receiving messages which works both on
// node.js and in the browser
var worker = {};
if (typeof self !== 'undefined' && typeof postMessage === 'function' && typeof addEventListener === 'function') {
  // worker in the browser
  worker.on = function (event, callback) {
    addEventListener(event, function (message) {
      callback(message.data);
    });
  };
  worker.send = function (message) {
    postMessage(message);
  };
}
else if (typeof process !== 'undefined') {
  // node.js

  var WorkerThreads;
  try {
    WorkerThreads = requireFoolWebpack('worker_threads');
  } catch(error) {
    if (typeof error === 'object' && error !== null && error.code === 'MODULE_NOT_FOUND') ; else {
      throw error;
    }
  }

  if (WorkerThreads &&
    /* if there is a parentPort, we are in a WorkerThread */
    WorkerThreads.parentPort !== null) {
    var parentPort  = WorkerThreads.parentPort;
    worker.send = parentPort.postMessage.bind(parentPort);
    worker.on = parentPort.on.bind(parentPort);
  } else {
    worker.on = process.on.bind(process);
    worker.send = process.send.bind(process);
    // register disconnect handler only for subprocess worker to exit when parent is killed unexpectedly
    worker.on('disconnect', function () {
      process.exit(1);
    });
  }
}
else {
  throw new Error('Script must be executed as a worker');
}

function convertError(error) {
  return Object.getOwnPropertyNames(error).reduce(function(product, name) {
    return Object.defineProperty(product, name, {
	value: error[name],
	enumerable: true
    });
  }, {});
}

/**
 * Test whether a value is a Promise via duck typing.
 * @param {*} value
 * @returns {boolean} Returns true when given value is an object
 *                    having functions `then` and `catch`.
 */
function isPromise(value) {
  return value && (typeof value.then === 'function') && (typeof value.catch === 'function');
}

// functions available externally
worker.methods = {};

/**
 * Execute a function with provided arguments
 * @param {String} fn     Stringified function
 * @param {Array} [args]  Function arguments
 * @returns {*}
 */
worker.methods.run = function run(fn, args) {
  var f = eval('(' + fn + ')');
  return f.apply(f, args);
};

/**
 * Get a list with methods available on this worker
 * @return {String[]} methods
 */
worker.methods.methods = function methods() {
  return Object.keys(worker.methods);
};

worker.on('message', function (request) {
  try {
    var method = worker.methods[request.method];

    if (method) {
      // execute the function
      var result = method.apply(method, request.params);

      if (isPromise(result)) {
        // promise returned, resolve this and then return
        result
            .then(function (result) {
              worker.send({
                id: request.id,
                result: result,
                error: null
              });
            })
            .catch(function (err) {
              worker.send({
                id: request.id,
                result: null,
                error: convertError(err)
              });
            });
      }
      else {
        // immediate result
        worker.send({
          id: request.id,
          result: result,
          error: null
        });
      }
    }
    else {
      throw new Error('Unknown method "' + request.method + '"');
    }
  }
  catch (err) {
    worker.send({
      id: request.id,
      result: null,
      error: convertError(err)
    });
  }
});

/**
 * Register methods to the worker
 * @param {Object} methods
 */
worker.register = function (methods) {

  if (methods) {
    for (var name in methods) {
      if (methods.hasOwnProperty(name)) {
        worker.methods[name] = methods[name];
      }
    }
  }

  worker.send('ready');

};

{
  exports.add = worker.register;
}
});

/**
 * Create a new worker pool
 * @param {string} [script]
 * @param {WorkerPoolOptions} [options]
 * @returns {Pool} pool
 */
var pool = function pool(script, options) {
  var Pool = Pool_1;

  return new Pool(script, options);
};

/**
 * Create a worker and optionally register a set of methods to the worker.
 * @param {Object} [methods]
 */
var worker = function worker(methods) {
  var worker = worker_1;
  worker.add(methods);
};

/**
 * Create a promise.
 * @type {Promise} promise
 */
var _Promise$1 = _Promise;

var platform = environment.platform;
var isMainThread = environment.isMainThread;
var cpus = environment.cpus;

var src$2 = {
	pool: pool,
	worker: worker,
	Promise: _Promise$1,
	platform: platform,
	isMainThread: isMainThread,
	cpus: cpus
};

const {type: type$1} = utils;
const {createInvalidArgumentTypeError: createInvalidArgumentTypeError$2} = errors;
// this is not named `mocha:parallel:serializer` because it's noisy and it's
// helpful to be able to write `DEBUG=mocha:parallel*` and get everything else.
const debug$2 = src('mocha:serializer');

const SERIALIZABLE_RESULT_NAME = 'SerializableWorkerResult';
const SERIALIZABLE_TYPES = new Set(['object', 'array', 'function', 'error']);

/**
 * The serializable result of a test file run from a worker.
 * @private
 */
class SerializableWorkerResult {
  /**
   * Creates instance props; of note, the `__type` prop.
   *
   * Note that the failure count is _redundant_ and could be derived from the
   * list of events; but since we're already doing the work, might as well use
   * it.
   * @param {SerializableEvent[]} [events=[]] - Events to eventually serialize
   * @param {number} [failureCount=0] - Failure count
   */
  constructor(events = [], failureCount = 0) {
    /**
     * The number of failures in this run
     * @type {number}
     */
    this.failureCount = failureCount;
    /**
     * All relevant events emitted from the {@link Runner}.
     * @type {SerializableEvent[]}
     */
    this.events = events;

    /**
     * Symbol-like value needed to distinguish when attempting to deserialize
     * this object (once it's been received over IPC).
     * @type {Readonly<"SerializableWorkerResult">}
     */
    Object.defineProperty(this, '__type', {
      value: SERIALIZABLE_RESULT_NAME,
      enumerable: true,
      writable: false
    });
  }

  /**
   * Instantiates a new {@link SerializableWorkerResult}.
   * @param {...any} args - Args to constructor
   * @returns {SerilizableWorkerResult}
   */
  static create(...args) {
    return new SerializableWorkerResult(...args);
  }

  /**
   * Serializes each {@link SerializableEvent} in our `events` prop;
   * makes this object read-only.
   * @returns {Readonly<SerializableWorkerResult>}
   */
  serialize() {
    this.events.forEach(event => {
      event.serialize();
    });
    return Object.freeze(this);
  }

  /**
   * Deserializes a {@link SerializedWorkerResult} into something reporters can
   * use; calls {@link SerializableEvent.deserialize} on each item in its
   * `events` prop.
   * @param {SerializedWorkerResult} obj
   * @returns {SerializedWorkerResult}
   */
  static deserialize(obj) {
    obj.events.forEach(event => {
      SerializableEvent.deserialize(event);
    });
    return obj;
  }

  /**
   * Returns `true` if this is a {@link SerializedWorkerResult} or a
   * {@link SerializableWorkerResult}.
   * @param {*} value - A value to check
   * @returns {boolean} If true, it's deserializable
   */
  static isSerializedWorkerResult(value) {
    return (
      value instanceof SerializableWorkerResult ||
      (type$1(value) === 'object' && value.__type === SERIALIZABLE_RESULT_NAME)
    );
  }
}

/**
 * Represents an event, emitted by a {@link Runner}, which is to be transmitted
 * over IPC.
 *
 * Due to the contents of the event data, it's not possible to send them
 * verbatim. When received by the main process--and handled by reporters--these
 * objects are expected to contain {@link Runnable} instances.  This class
 * provides facilities to perform the translation via serialization and
 * deserialization.
 * @private
 */
class SerializableEvent {
  /**
   * Constructs a `SerializableEvent`, throwing if we receive unexpected data.
   *
   * Practically, events emitted from `Runner` have a minumum of zero (0)
   * arguments-- (for example, {@link Runnable.constants.EVENT_RUN_BEGIN}) and a
   * maximum of two (2) (for example,
   * {@link Runnable.constants.EVENT_TEST_FAIL}, where the second argument is an
   * `Error`).  The first argument, if present, is a {@link Runnable}. This
   * constructor's arguments adhere to this convention.
   * @param {string} eventName - A non-empty event name.
   * @param {any} [originalValue] - Some data. Corresponds to extra arguments
   * passed to `EventEmitter#emit`.
   * @param {Error} [originalError] - An error, if there's an error.
   * @throws If `eventName` is empty, or `originalValue` is a non-object.
   */
  constructor(eventName, originalValue, originalError) {
    if (!eventName) {
      throw new Error('expected a non-empty `eventName` string argument');
    }
    /**
     * The event name.
     * @memberof SerializableEvent
     */
    this.eventName = eventName;
    const originalValueType = type$1(originalValue);
    if (originalValueType !== 'object' && originalValueType !== 'undefined') {
      throw new Error(
        `expected object, received [${originalValueType}]: ${originalValue}`
      );
    }
    /**
     * An error, if present.
     * @memberof SerializableEvent
     */
    Object.defineProperty(this, 'originalError', {
      value: originalError,
      enumerable: false
    });

    /**
     * The raw value.
     *
     * We don't want this value sent via IPC; making it non-enumerable will do that.
     *
     * @memberof SerializableEvent
     */
    Object.defineProperty(this, 'originalValue', {
      value: originalValue,
      enumerable: false
    });
  }

  /**
   * In case you hated using `new` (I do).
   *
   * @param  {...any} args - Args for {@link SerializableEvent#constructor}.
   * @returns {SerializableEvent} A new `SerializableEvent`
   */
  static create(...args) {
    return new SerializableEvent(...args);
  }

  /**
   * Used internally by {@link SerializableEvent#serialize}.
   * @ignore
   * @param {Array<object|string>} pairs - List of parent/key tuples to process; modified in-place. This JSDoc type is an approximation
   * @param {object} parent - Some parent object
   * @param {string} key - Key to inspect
   * @param {WeakSet<Object>} seenObjects - For avoiding circular references
   */
  static _serialize(pairs, parent, key, seenObjects) {
    let value = parent[key];
    if (seenObjects.has(value)) {
      parent[key] = Object.create(null);
      return;
    }
    if (type$1(value) === 'error' || value instanceof Error) {
      // we need to reference the stack prop b/c it's lazily-loaded.
      // `__type` is necessary for deserialization to create an `Error` later.
      // `message` is apparently not enumerable, so we must handle it specifically.
      value = Object.assign(Object.create(null), value, {
        stack: value.stack,
        message: value.message,
        __type: 'Error'
      });
      parent[key] = value;
      // after this, the result of type(value) will be `object`, and we'll throw
      // whatever other junk is in the original error into the new `value`.
    }
    switch (type$1(value)) {
      case 'object':
        if (type$1(value.serialize) === 'function') {
          parent[key] = value.serialize();
        } else {
          // by adding props to the `pairs` array, we will process it further
          pairs.push(
            ...Object.keys(value)
              .filter(key => SERIALIZABLE_TYPES.has(type$1(value[key])))
              .map(key => [value, key])
          );
        }
        break;
      case 'function':
        // we _may_ want to dig in to functions for some assertion libraries
        // that might put a usable property on a function.
        // for now, just zap it.
        delete parent[key];
        break;
      case 'array':
        pairs.push(
          ...value
            .filter(value => SERIALIZABLE_TYPES.has(type$1(value)))
            .map((value, index) => [value, index])
        );
        break;
    }
  }

  /**
   * Modifies this object *in place* (for theoretical memory consumption &
   * performance reasons); serializes `SerializableEvent#originalValue` (placing
   * the result in `SerializableEvent#data`) and `SerializableEvent#error`.
   * Freezes this object. The result is an object that can be transmitted over
   * IPC.
   * If this quickly becomes unmaintainable, we will want to move towards immutable
   * objects post-haste.
   */
  serialize() {
    // given a parent object and a key, inspect the value and decide whether
    // to replace it, remove it, or add it to our `pairs` array to further process.
    // this is recursion in loop form.
    const originalValue = this.originalValue;
    const result = Object.assign(Object.create(null), {
      data:
        type$1(originalValue) === 'object' &&
        type$1(originalValue.serialize) === 'function'
          ? originalValue.serialize()
          : originalValue,
      error: this.originalError
    });

    const pairs = Object.keys(result).map(key => [result, key]);
    const seenObjects = new WeakSet();

    let pair;
    while ((pair = pairs.shift())) {
      SerializableEvent._serialize(pairs, ...pair, seenObjects);
      seenObjects.add(pair[0]);
    }

    this.data = result.data;
    this.error = result.error;

    return Object.freeze(this);
  }

  /**
   * Used internally by {@link SerializableEvent.deserialize}; creates an `Error`
   * from an `Error`-like (serialized) object
   * @ignore
   * @param {Object} value - An Error-like value
   * @returns {Error} Real error
   */
  static _deserializeError(value) {
    const error = new Error(value.message);
    error.stack = value.stack;
    Object.assign(error, value);
    delete error.__type;
    return error;
  }

  /**
   * Used internally by {@link SerializableEvent.deserialize}; recursively
   * deserializes an object in-place.
   * @param {object|Array} parent - Some object or array
   * @param {string|number} key - Some prop name or array index within `parent`
   */
  static _deserializeObject(parent, key) {
    if (key === '__proto__') {
      delete parent[key];
      return;
    }
    const value = parent[key];
    // keys beginning with `$$` are converted into functions returning the value
    // and renamed, stripping the `$$` prefix.
    // functions defined this way cannot be array members!
    if (type$1(key) === 'string' && key.startsWith('$$')) {
      const newKey = key.slice(2);
      parent[newKey] = () => value;
      delete parent[key];
      key = newKey;
    }
    if (type$1(value) === 'array') {
      value.forEach((_, idx) => {
        SerializableEvent._deserializeObject(value, idx);
      });
    } else if (type$1(value) === 'object') {
      if (value.__type === 'Error') {
        parent[key] = SerializableEvent._deserializeError(value);
      } else {
        Object.keys(value).forEach(key => {
          SerializableEvent._deserializeObject(value, key);
        });
      }
    }
  }

  /**
   * Deserialize value returned from a worker into something more useful.
   * Does not return the same object.
   * @todo do this in a loop instead of with recursion (if necessary)
   * @param {SerializedEvent} obj - Object returned from worker
   * @returns {SerializedEvent} Deserialized result
   */
  static deserialize(obj) {
    if (!obj) {
      throw createInvalidArgumentTypeError$2('Expected value', obj);
    }

    obj = Object.assign(Object.create(null), obj);

    if (obj.data) {
      Object.keys(obj.data).forEach(key => {
        SerializableEvent._deserializeObject(obj.data, key);
      });
    }

    if (obj.error) {
      obj.error = SerializableEvent._deserializeError(obj.error);
    }

    return obj;
  }
}

/**
 * "Serializes" a value for transmission over IPC as a message.
 *
 * If value is an object and has a `serialize()` method, call that method; otherwise return the object and hope for the best.
 *
 * @param {*} [value] - A value to serialize
 */
var serialize = function serialize(value) {
  const result =
    type$1(value) === 'object' && type$1(value.serialize) === 'function'
      ? value.serialize()
      : value;
  debug$2('serialized: %O', result);
  return result;
};

/**
 * "Deserializes" a "message" received over IPC.
 *
 * This could be expanded with other objects that need deserialization,
 * but at present time we only care about {@link SerializableWorkerResult} objects.
 *
 * @param {*} [value] - A "message" to deserialize
 */
var deserialize = function deserialize(value) {
  const result = SerializableWorkerResult.isSerializedWorkerResult(value)
    ? SerializableWorkerResult.deserialize(value)
    : value;
  debug$2('deserialized: %O', result);
  return result;
};

var SerializableEvent_1 = SerializableEvent;
var SerializableWorkerResult_1 = SerializableWorkerResult;

/**
 * The result of calling `SerializableEvent.serialize`, as received
 * by the deserializer.
 * @private
 * @typedef {Object} SerializedEvent
 * @property {object?} data - Optional serialized data
 * @property {object?} error - Optional serialized `Error`
 */

/**
 * The result of calling `SerializableWorkerResult.serialize` as received
 * by the deserializer.
 * @private
 * @typedef {Object} SerializedWorkerResult
 * @property {number} failureCount - Number of failures
 * @property {SerializedEvent[]} events - Serialized events
 * @property {"SerializedWorkerResult"} __type - Symbol-like to denote the type of object this is
 */

var serializer = {
	serialize: serialize,
	deserialize: deserialize,
	SerializableEvent: SerializableEvent_1,
	SerializableWorkerResult: SerializableWorkerResult_1
};

const {deserialize: deserialize$1} = serializer;
const debug$3 = src('mocha:parallel:buffered-worker-pool');
const {createInvalidArgumentTypeError: createInvalidArgumentTypeError$3} = errors;

const WORKER_PATH = require.resolve('./worker.js');

/**
 * A mapping of Mocha `Options` objects to serialized values.
 *
 * This is helpful because we tend to same the same options over and over
 * over IPC.
 * @type {WeakMap<Options,string>}
 */
let optionsCache = new WeakMap();

/**
 * These options are passed into the [workerpool](https://npm.im/workerpool) module.
 * @type {Partial<WorkerPoolOptions>}
 */
const WORKER_POOL_DEFAULT_OPTS = {
  // use child processes, not worker threads!
  workerType: 'process',
  // ensure the same flags sent to `node` for this `mocha` invocation are passed
  // along to children
  forkOpts: {execArgv: process.execArgv},
  maxWorkers: src$2.cpus - 1
};

/**
 * A wrapper around a third-party worker pool implementation.
 * @private
 */
class BufferedWorkerPool {
  /**
   * Creates an underlying worker pool instance; determines max worker count
   * @param {Partial<WorkerPoolOptions>} [opts] - Options
   */
  constructor(opts = {}) {
    const maxWorkers = Math.max(
      1,
      typeof opts.maxWorkers === 'undefined'
        ? WORKER_POOL_DEFAULT_OPTS.maxWorkers
        : opts.maxWorkers
    );

    /* istanbul ignore next */
    if (src$2.cpus < 2) {
      // TODO: decide whether we should warn
      debug$3(
        'not enough CPU cores available to run multiple jobs; avoid --parallel on this machine'
      );
    } else if (maxWorkers >= src$2.cpus) {
      // TODO: decide whether we should warn
      debug$3(
        '%d concurrent job(s) requested, but only %d core(s) available',
        maxWorkers,
        src$2.cpus
      );
    }
    /* istanbul ignore next */
    debug$3(
      'run(): starting worker pool of max size %d, using node args: %s',
      maxWorkers,
      process.execArgv.join(' ')
    );

    this.options = Object.assign({}, WORKER_POOL_DEFAULT_OPTS, opts, {
      maxWorkers
    });
    this._pool = src$2.pool(WORKER_PATH, this.options);
  }

  /**
   * Terminates all workers in the pool.
   * @param {boolean} [force] - Whether to force-kill workers. By default, lets workers finish their current task before termination.
   * @private
   * @returns {Promise<void>}
   */
  async terminate(force = false) {
    /* istanbul ignore next */
    debug$3('terminate(): terminating with force = %s', force);
    return this._pool.terminate(force);
  }

  /**
   * Adds a test file run to the worker pool queue for execution by a worker process.
   *
   * Handles serialization/deserialization.
   *
   * @param {string} filepath - Filepath of test
   * @param {Options} [options] - Options for Mocha instance
   * @private
   * @returns {Promise<SerializedWorkerResult>}
   */
  async run(filepath, options = {}) {
    if (!filepath || typeof filepath !== 'string') {
      throw createInvalidArgumentTypeError$3(
        'Expected a non-empty filepath',
        'filepath',
        'string'
      );
    }
    const serializedOptions = BufferedWorkerPool.serializeOptions(options);
    const result = await this._pool.exec('run', [filepath, serializedOptions]);
    return deserialize$1(result);
  }

  /**
   * Returns stats about the state of the worker processes in the pool.
   *
   * Used for debugging.
   *
   * @private
   */
  stats() {
    return this._pool.stats();
  }

  /**
   * Instantiates a {@link WorkerPool}.
   * @private
   */
  static create(...args) {
    return new BufferedWorkerPool(...args);
  }

  /**
   * Given Mocha options object `opts`, serialize into a format suitable for
   * transmission over IPC.
   *
   * @param {Options} [opts] - Mocha options
   * @private
   * @returns {string} Serialized options
   */
  static serializeOptions(opts = {}) {
    if (!optionsCache.has(opts)) {
      const serialized = serializeJavascript(opts, {
        unsafe: true, // this means we don't care about XSS
        ignoreFunction: true // do not serialize functions
      });
      optionsCache.set(opts, serialized);
      /* istanbul ignore next */
      debug$3(
        'serializeOptions(): serialized options %O to: %s',
        opts,
        serialized
      );
    }
    return optionsCache.get(opts);
  }

  /**
   * Resets internal cache of serialized options objects.
   *
   * For testing/debugging
   * @private
   */
  static resetOptionsCache() {
    optionsCache = new WeakMap();
  }
}

var BufferedWorkerPool_1 = BufferedWorkerPool;

var bufferedWorkerPool = {
	BufferedWorkerPool: BufferedWorkerPool_1
};

const {EVENT_RUN_BEGIN: EVENT_RUN_BEGIN$1, EVENT_RUN_END: EVENT_RUN_END$2} = runner.constants;
const debug$4 = src('mocha:parallel:parallel-buffered-runner');
const {BufferedWorkerPool: BufferedWorkerPool$1} = bufferedWorkerPool;
const {setInterval, clearInterval} = commonjsGlobal;
const {createMap} = utils;

/**
 * Outputs a debug statement with worker stats
 * @param {BufferedWorkerPool} pool - Worker pool
 */
/* istanbul ignore next */
const debugStats = pool => {
  const {totalWorkers, busyWorkers, idleWorkers, pendingTasks} = pool.stats();
  debug$4(
    '%d/%d busy workers; %d idle; %d tasks queued',
    busyWorkers,
    totalWorkers,
    idleWorkers,
    pendingTasks
  );
};

/**
 * The interval at which we will display stats for worker processes in debug mode
 */
const DEBUG_STATS_INTERVAL = 5000;

const ABORTED = 'ABORTED';
const IDLE = 'IDLE';
const ABORTING = 'ABORTING';
const RUNNING = 'RUNNING';
const BAILING = 'BAILING';
const BAILED = 'BAILED';
const COMPLETE = 'COMPLETE';

const states = createMap({
  [IDLE]: new Set([RUNNING, ABORTING]),
  [RUNNING]: new Set([COMPLETE, BAILING, ABORTING]),
  [COMPLETE]: new Set(),
  [ABORTED]: new Set(),
  [ABORTING]: new Set([ABORTED]),
  [BAILING]: new Set([BAILED, ABORTING]),
  [BAILED]: new Set([COMPLETE, ABORTING])
});

/**
 * This `Runner` delegates tests runs to worker threads.  Does not execute any
 * {@link Runnable}s by itself!
 * @private
 */
class ParallelBufferedRunner extends runner {
  constructor(...args) {
    super(...args);

    let state = IDLE;
    Object.defineProperty(this, '_state', {
      get() {
        return state;
      },
      set(newState) {
        if (states[state].has(newState)) {
          state = newState;
        } else {
          throw new Error(`invalid state transition: ${state} => ${newState}`);
        }
      }
    });

    this.once(runner.constants.EVENT_RUN_END, () => {
      this._state = COMPLETE;
    });
  }

  /**
   * Returns a mapping function to enqueue a file in the worker pool and return results of its execution.
   * @param {BufferedWorkerPool} pool - Worker pool
   * @param {Options} options - Mocha options
   * @returns {FileRunner} Mapping function
   */
  _createFileRunner(pool, options) {
    return async file => {
      debug$4('run(): enqueueing test file %s', file);
      try {
        const {failureCount, events} = await pool.run(file, options);
        if (this._state === BAILED) {
          // short-circuit after a graceful bail. if this happens,
          // some other worker has bailed.
          // TODO: determine if this is the desired behavior, or if we
          // should report the events of this run anyway.
          return;
        }
        debug$4(
          'run(): completed run of file %s; %d failures / %d events',
          file,
          failureCount,
          events.length
        );
        this.failures += failureCount; // can this ever be non-numeric?
        let event = events.shift();
        while (event) {
          this.emit(event.eventName, event.data, event.error);
          if (
            this._state !== BAILING &&
            event.data &&
            event.data._bail &&
            (failureCount || event.error)
          ) {
            debug$4('run(): nonzero failure count & found bail flag');
            // we need to let the events complete for this file, as the worker
            // should run any cleanup hooks
            this._state = BAILING;
          }
          event = events.shift();
        }
        if (this._state === BAILING) {
          debug$4('run(): terminating pool due to "bail" flag');
          this._state = BAILED;
          await pool.terminate();
        }
      } catch (err) {
        if (this._state === BAILED || this._state === ABORTING) {
          debug$4(
            'run(): worker pool terminated with intent; skipping file %s',
            file
          );
        } else {
          // this is an uncaught exception
          debug$4('run(): encountered uncaught exception: %O', err);
          if (this.allowUncaught) {
            // still have to clean up
            this._state = ABORTING;
            await pool.terminate(true);
          }
          throw err;
        }
      } finally {
        debug$4('run(): done running file %s', file);
      }
    };
  }

  /**
   * Listen on `Process.SIGINT`; terminate pool if caught.
   * Returns the listener for later call to `process.removeListener()`.
   * @param {BufferedWorkerPool} pool - Worker pool
   * @returns {SigIntListener} Listener
   */
  _bindSigIntListener(pool) {
    const sigIntListener = async () => {
      debug$4('run(): caught a SIGINT');
      this._state = ABORTING;

      try {
        debug$4('run(): force-terminating worker pool');
        await pool.terminate(true);
      } catch (err) {
        console.error(
          `Error while attempting to force-terminate worker pool: ${err}`
        );
        process.exitCode = 1;
      } finally {
        process.nextTick(() => {
          debug$4('run(): imminent death');
          this._state = ABORTED;
          process.kill(process.pid, 'SIGINT');
        });
      }
    };

    process.once('SIGINT', sigIntListener);

    return sigIntListener;
  }

  /**
   * Runs Mocha tests by creating a thread pool, then delegating work to the
   * worker threads.
   *
   * Each worker receives one file, and as workers become available, they take a
   * file from the queue and run it. The worker thread execution is treated like
   * an RPC--it returns a `Promise` containing serialized information about the
   * run.  The information is processed as it's received, and emitted to a
   * {@link Reporter}, which is likely listening for these events.
   *
   * @param {Function} callback - Called with an exit code corresponding to
   * number of test failures.
   * @param {{files: string[], options: Options}} opts - Files to run and
   * command-line options, respectively.
   */
  run(callback, {files, options} = {}) {
    /**
     * Listener on `Process.SIGINT` which tries to cleanly terminate the worker pool.
     */
    let sigIntListener;
    // This function should _not_ return a `Promise`; its parent (`Runner#run`)
    // returns this instance, so this should do the same. However, we want to make
    // use of `async`/`await`, so we use this IIFE.

    (async () => {
      /**
       * This is an interval that outputs stats about the worker pool every so often
       */
      let debugInterval;

      /**
       * @type {BufferedWorkerPool}
       */
      let pool;

      try {
        pool = BufferedWorkerPool$1.create({maxWorkers: options.jobs});

        sigIntListener = this._bindSigIntListener(pool);

        /* istanbul ignore next */
        debugInterval = setInterval(
          () => debugStats(pool),
          DEBUG_STATS_INTERVAL
        ).unref();

        // this is set for uncaught exception handling in `Runner#uncaught`
        // TODO: `Runner` should be using a state machine instead.
        this.started = true;
        this._state = RUNNING;

        this.emit(EVENT_RUN_BEGIN$1);

        const results = await promise_allsettled(
          files.map(this._createFileRunner(pool, options))
        );

        // note that pool may already be terminated due to --bail
        await pool.terminate();

        results
          .filter(({status}) => status === 'rejected')
          .forEach(({reason}) => {
            if (this.allowUncaught) {
              // yep, just the first one.
              throw reason;
            }
            // "rejected" will correspond to uncaught exceptions.
            // unlike the serial runner, the parallel runner can always recover.
            this.uncaught(reason);
          });

        if (this._state === ABORTING) {
          return;
        }
        this.emit(EVENT_RUN_END$2);
        debug$4('run(): completing with failure count %d', this.failures);
        callback(this.failures);
      } catch (err) {
        // this `nextTick` takes us out of the `Promise` scope, so the
        // exception will not be caught and returned as a rejected `Promise`,
        // which would lead to an `unhandledRejection` event.
        process.nextTick(() => {
          debug$4('run(): re-throwing uncaught exception');
          throw err;
        });
      } finally {
        clearInterval(debugInterval);
        process.removeListener('SIGINT', sigIntListener);
      }
    })();
    return this;
  }
}

var parallelBufferedRunner = ParallelBufferedRunner;

var mocharc$2 = getCjsExportFromNamespace(mocharc$1);

var require$$8 = getCjsExportFromNamespace(_package$1);

var mocha = createCommonjsModule(function (module, exports) {

/*!
 * mocha
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */









var esmUtils$1 = utils.supportsEsModules(true)
  ? esmUtils
  : undefined;

var createInvalidReporterError = errors.createInvalidReporterError;
var createInvalidInterfaceError = errors.createInvalidInterfaceError;
var createMochaInstanceAlreadyDisposedError =
  errors.createMochaInstanceAlreadyDisposedError;
var createMochaInstanceAlreadyRunningError =
  errors.createMochaInstanceAlreadyRunningError;
var EVENT_FILE_PRE_REQUIRE = suite.constants.EVENT_FILE_PRE_REQUIRE;
var EVENT_FILE_POST_REQUIRE = suite.constants.EVENT_FILE_POST_REQUIRE;
var EVENT_FILE_REQUIRE = suite.constants.EVENT_FILE_REQUIRE;
var sQuote = utils.sQuote;
var debug = src('mocha:mocha');

exports = module.exports = Mocha;

/**
 * A Mocha instance is a finite state machine.
 * These are the states it can be in.
 * @private
 */
var mochaStates = utils.defineConstants({
  /**
   * Initial state of the mocha instance
   * @private
   */
  INIT: 'init',
  /**
   * Mocha instance is running tests
   * @private
   */
  RUNNING: 'running',
  /**
   * Mocha instance is done running tests and references to test functions and hooks are cleaned.
   * You can reset this state by unloading the test files.
   * @private
   */
  REFERENCES_CLEANED: 'referencesCleaned',
  /**
   * Mocha instance is disposed and can no longer be used.
   * @private
   */
  DISPOSED: 'disposed'
});

/**
 * To require local UIs and reporters when running in node.
 */

if (!utils.isBrowser() && typeof module.paths !== 'undefined') {
  var cwd = utils.cwd();
  module.paths.push(cwd, path.join(cwd, 'node_modules'));
}

/**
 * Expose internals.
 * @private
 */

exports.utils = utils;
exports.interfaces = interfaces;
/**
 * @public
 * @memberof Mocha
 */
exports.reporters = reporters;
exports.Runnable = runnable;
exports.Context = context;
/**
 *
 * @memberof Mocha
 */
exports.Runner = runner;
exports.Suite = suite;
exports.Hook = hook;
exports.Test = test;

/**
 * Constructs a new Mocha instance with `options`.
 *
 * @public
 * @class Mocha
 * @param {Object} [options] - Settings object.
 * @param {boolean} [options.allowUncaught] - Propagate uncaught errors?
 * @param {boolean} [options.asyncOnly] - Force `done` callback or promise?
 * @param {boolean} [options.bail] - Bail after first test failure?
 * @param {boolean} [options.checkLeaks] - Check for global variable leaks?
 * @param {boolean} [options.color] - Color TTY output from reporter?
 * @param {boolean} [options.delay] - Delay root suite execution?
 * @param {boolean} [options.diff] - Show diff on failure?
 * @param {string} [options.fgrep] - Test filter given string.
 * @param {boolean} [options.forbidOnly] - Tests marked `only` fail the suite?
 * @param {boolean} [options.forbidPending] - Pending tests fail the suite?
 * @param {boolean} [options.fullTrace] - Full stacktrace upon failure?
 * @param {string[]} [options.global] - Variables expected in global scope.
 * @param {RegExp|string} [options.grep] - Test filter given regular expression.
 * @param {boolean} [options.growl] - Enable desktop notifications?
 * @param {boolean} [options.inlineDiffs] - Display inline diffs?
 * @param {boolean} [options.invert] - Invert test filter matches?
 * @param {boolean} [options.noHighlighting] - Disable syntax highlighting?
 * @param {string|constructor} [options.reporter] - Reporter name or constructor.
 * @param {Object} [options.reporterOption] - Reporter settings object.
 * @param {number} [options.retries] - Number of times to retry failed tests.
 * @param {number} [options.slow] - Slow threshold value.
 * @param {number|string} [options.timeout] - Timeout threshold value.
 * @param {string} [options.ui] - Interface name.
 * @param {boolean} [options.parallel] - Run jobs in parallel
 * @param {number} [options.jobs] - Max number of worker processes for parallel runs
 * @param {MochaRootHookObject} [options.rootHooks] - Hooks to bootstrap the root
 * suite with
 * @param {boolean} [options.isWorker] - Should be `true` if `Mocha` process is running in a worker process.
 */
function Mocha(options) {
  options = utils.assign({}, mocharc$2, options || {});
  this.files = [];
  this.options = options;
  // root suite
  this.suite = new exports.Suite('', new exports.Context(), true);
  this._cleanReferencesAfterRun = true;
  this._state = mochaStates.INIT;

  this.grep(options.grep)
    .fgrep(options.fgrep)
    .ui(options.ui)
    .reporter(
      options.reporter,
      options.reporterOption || options.reporterOptions // reporterOptions was previously the only way to specify options to reporter
    )
    .slow(options.slow)
    .global(options.global);

  // this guard exists because Suite#timeout does not consider `undefined` to be valid input
  if (typeof options.timeout !== 'undefined') {
    this.timeout(options.timeout === false ? 0 : options.timeout);
  }

  if ('retries' in options) {
    this.retries(options.retries);
  }

  [
    'allowUncaught',
    'asyncOnly',
    'bail',
    'checkLeaks',
    'color',
    'delay',
    'diff',
    'forbidOnly',
    'forbidPending',
    'fullTrace',
    'growl',
    'inlineDiffs',
    'invert'
  ].forEach(function(opt) {
    if (options[opt]) {
      this[opt]();
    }
  }, this);

  if (options.rootHooks) {
    this.rootHooks(options.rootHooks);
  }

  /**
   * The class which we'll instantiate in {@link Mocha#run}.  Defaults to
   * {@link Runner} in serial mode; changes in parallel mode.
   * @memberof Mocha
   * @private
   */
  this._runnerClass = exports.Runner;

  /**
   * Whether or not to call {@link Mocha#loadFiles} implicitly when calling
   * {@link Mocha#run}.  If this is `true`, then it's up to the consumer to call
   * {@link Mocha#loadFiles} _or_ {@link Mocha#loadFilesAsync}.
   * @private
   * @memberof Mocha
   */
  this._lazyLoadFiles = false;

  /**
   * It's useful for a Mocha instance to know if it's running in a worker process.
   * We could derive this via other means, but it's helpful to have a flag to refer to.
   * @memberof Mocha
   * @private
   */
  this.isWorker = Boolean(options.isWorker);

  if (
    options.parallel &&
    (typeof options.jobs === 'undefined' || options.jobs > 1)
  ) {
    debug('attempting to enable parallel mode');
    this.parallelMode(true);
  }
}

/**
 * Enables or disables bailing on the first failure.
 *
 * @public
 * @see [CLI option](../#-bail-b)
 * @param {boolean} [bail=true] - Whether to bail on first error.
 * @returns {Mocha} this
 * @chainable
 */
Mocha.prototype.bail = function(bail) {
  this.suite.bail(bail !== false);
  return this;
};

/**
 * @summary
 * Adds `file` to be loaded for execution.
 *
 * @description
 * Useful for generic setup code that must be included within test suite.
 *
 * @public
 * @see [CLI option](../#-file-filedirectoryglob)
 * @param {string} file - Pathname of file to be loaded.
 * @returns {Mocha} this
 * @chainable
 */
Mocha.prototype.addFile = function(file) {
  this.files.push(file);
  return this;
};

/**
 * Sets reporter to `reporter`, defaults to "spec".
 *
 * @public
 * @see [CLI option](../#-reporter-name-r-name)
 * @see [Reporters](../#reporters)
 * @param {String|Function} reporterName - Reporter name or constructor.
 * @param {Object} [reporterOptions] - Options used to configure the reporter.
 * @returns {Mocha} this
 * @chainable
 * @throws {Error} if requested reporter cannot be loaded
 * @example
 *
 * // Use XUnit reporter and direct its output to file
 * mocha.reporter('xunit', { output: '/path/to/testspec.xunit.xml' });
 */
Mocha.prototype.reporter = function(reporterName, reporterOptions) {
  if (typeof reporterName === 'function') {
    this._reporter = reporterName;
  } else {
    reporterName = reporterName || 'spec';
    var reporter;
    // Try to load a built-in reporter.
    if (reporters[reporterName]) {
      reporter = reporters[reporterName];
    }
    // Try to load reporters from process.cwd() and node_modules
    if (!reporter) {
      try {
        reporter = commonjsRequire(reporterName);
      } catch (err) {
        if (
          err.code === 'MODULE_NOT_FOUND' ||
          err.message.indexOf('Cannot find module') >= 0
        ) {
          // Try to load reporters from a path (absolute or relative)
          try {
            reporter = commonjsRequire(path.resolve(utils.cwd(), reporterName));
          } catch (_err) {
            _err.code === 'MODULE_NOT_FOUND' ||
            _err.message.indexOf('Cannot find module') >= 0
              ? utils.warn(sQuote(reporterName) + ' reporter not found')
              : utils.warn(
                  sQuote(reporterName) +
                    ' reporter blew up with error:\n' +
                    err.stack
                );
          }
        } else {
          utils.warn(
            sQuote(reporterName) + ' reporter blew up with error:\n' + err.stack
          );
        }
      }
    }
    if (!reporter) {
      throw createInvalidReporterError(
        'invalid reporter ' + sQuote(reporterName),
        reporterName
      );
    }
    this._reporter = reporter;
  }
  this.options.reporterOption = reporterOptions;
  // alias option name is used in public reporters xunit/tap/progress
  this.options.reporterOptions = reporterOptions;
  return this;
};

/**
 * Sets test UI `name`, defaults to "bdd".
 *
 * @public
 * @see [CLI option](../#-ui-name-u-name)
 * @see [Interface DSLs](../#interfaces)
 * @param {string|Function} [ui=bdd] - Interface name or class.
 * @returns {Mocha} this
 * @chainable
 * @throws {Error} if requested interface cannot be loaded
 */
Mocha.prototype.ui = function(ui) {
  var bindInterface;
  if (typeof ui === 'function') {
    bindInterface = ui;
  } else {
    ui = ui || 'bdd';
    bindInterface = exports.interfaces[ui];
    if (!bindInterface) {
      try {
        bindInterface = commonjsRequire(ui);
      } catch (err) {
        throw createInvalidInterfaceError(
          'invalid interface ' + sQuote(ui),
          ui
        );
      }
    }
  }
  bindInterface(this.suite);

  this.suite.on(EVENT_FILE_PRE_REQUIRE, function(context) {
    exports.afterEach = context.afterEach || context.teardown;
    exports.after = context.after || context.suiteTeardown;
    exports.beforeEach = context.beforeEach || context.setup;
    exports.before = context.before || context.suiteSetup;
    exports.describe = context.describe || context.suite;
    exports.it = context.it || context.test;
    exports.xit = context.xit || (context.test && context.test.skip);
    exports.setup = context.setup || context.beforeEach;
    exports.suiteSetup = context.suiteSetup || context.before;
    exports.suiteTeardown = context.suiteTeardown || context.after;
    exports.suite = context.suite || context.describe;
    exports.teardown = context.teardown || context.afterEach;
    exports.test = context.test || context.it;
    exports.run = context.run;
  });

  return this;
};

/**
 * Loads `files` prior to execution. Does not support ES Modules.
 *
 * @description
 * The implementation relies on Node's `require` to execute
 * the test interface functions and will be subject to its cache.
 * Supports only CommonJS modules. To load ES modules, use Mocha#loadFilesAsync.
 *
 * @private
 * @see {@link Mocha#addFile}
 * @see {@link Mocha#run}
 * @see {@link Mocha#unloadFiles}
 * @see {@link Mocha#loadFilesAsync}
 * @param {Function} [fn] - Callback invoked upon completion.
 */
Mocha.prototype.loadFiles = function(fn) {
  var self = this;
  var suite = this.suite;
  this.files.forEach(function(file) {
    file = path.resolve(file);
    suite.emit(EVENT_FILE_PRE_REQUIRE, commonjsGlobal, file, self);
    suite.emit(EVENT_FILE_REQUIRE, commonjsRequire(), file, self);
    suite.emit(EVENT_FILE_POST_REQUIRE, commonjsGlobal, file, self);
  });
  fn && fn();
};

/**
 * Loads `files` prior to execution. Supports Node ES Modules.
 *
 * @description
 * The implementation relies on Node's `require` and `import` to execute
 * the test interface functions and will be subject to its cache.
 * Supports both CJS and ESM modules.
 *
 * @public
 * @see {@link Mocha#addFile}
 * @see {@link Mocha#run}
 * @see {@link Mocha#unloadFiles}
 * @returns {Promise}
 * @example
 *
 * // loads ESM (and CJS) test files asynchronously, then runs root suite
 * mocha.loadFilesAsync()
 *   .then(() => mocha.run(failures => process.exitCode = failures ? 1 : 0))
 *   .catch(() => process.exitCode = 1);
 */
Mocha.prototype.loadFilesAsync = function() {
  var self = this;
  var suite = this.suite;
  this.lazyLoadFiles(true);

  if (!esmUtils$1) {
    return new Promise(function(resolve) {
      self.loadFiles(resolve);
    });
  }

  return esmUtils$1.loadFilesAsync(
    this.files,
    function(file) {
      suite.emit(EVENT_FILE_PRE_REQUIRE, commonjsGlobal, file, self);
    },
    function(file, resultModule) {
      suite.emit(EVENT_FILE_REQUIRE, resultModule, file, self);
      suite.emit(EVENT_FILE_POST_REQUIRE, commonjsGlobal, file, self);
    }
  );
};

/**
 * Removes a previously loaded file from Node's `require` cache.
 *
 * @private
 * @static
 * @see {@link Mocha#unloadFiles}
 * @param {string} file - Pathname of file to be unloaded.
 */
Mocha.unloadFile = function(file) {
  delete require.cache[require.resolve(file)];
};

/**
 * Unloads `files` from Node's `require` cache.
 *
 * @description
 * This allows required files to be "freshly" reloaded, providing the ability
 * to reuse a Mocha instance programmatically.
 * Note: does not clear ESM module files from the cache
 *
 * <strong>Intended for consumers &mdash; not used internally</strong>
 *
 * @public
 * @see {@link Mocha#run}
 * @returns {Mocha} this
 * @chainable
 */
Mocha.prototype.unloadFiles = function() {
  if (this._state === mochaStates.DISPOSED) {
    throw createMochaInstanceAlreadyDisposedError(
      'Mocha instance is already disposed, it cannot be used again.',
      this._cleanReferencesAfterRun,
      this
    );
  }

  this.files.forEach(function(file) {
    Mocha.unloadFile(file);
  });
  this._state = mochaStates.INIT;
  return this;
};

/**
 * Sets `grep` filter after escaping RegExp special characters.
 *
 * @public
 * @see {@link Mocha#grep}
 * @param {string} str - Value to be converted to a regexp.
 * @returns {Mocha} this
 * @chainable
 * @example
 *
 * // Select tests whose full title begins with `"foo"` followed by a period
 * mocha.fgrep('foo.');
 */
Mocha.prototype.fgrep = function(str) {
  if (!str) {
    return this;
  }
  return this.grep(new RegExp(escapeStringRegexp(str)));
};

/**
 * @summary
 * Sets `grep` filter used to select specific tests for execution.
 *
 * @description
 * If `re` is a regexp-like string, it will be converted to regexp.
 * The regexp is tested against the full title of each test (i.e., the
 * name of the test preceded by titles of each its ancestral suites).
 * As such, using an <em>exact-match</em> fixed pattern against the
 * test name itself will not yield any matches.
 * <br>
 * <strong>Previous filter value will be overwritten on each call!</strong>
 *
 * @public
 * @see [CLI option](../#-grep-regexp-g-regexp)
 * @see {@link Mocha#fgrep}
 * @see {@link Mocha#invert}
 * @param {RegExp|String} re - Regular expression used to select tests.
 * @return {Mocha} this
 * @chainable
 * @example
 *
 * // Select tests whose full title contains `"match"`, ignoring case
 * mocha.grep(/match/i);
 * @example
 *
 * // Same as above but with regexp-like string argument
 * mocha.grep('/match/i');
 * @example
 *
 * // ## Anti-example
 * // Given embedded test `it('only-this-test')`...
 * mocha.grep('/^only-this-test$/');    // NO! Use `.only()` to do this!
 */
Mocha.prototype.grep = function(re) {
  if (utils.isString(re)) {
    // extract args if it's regex-like, i.e: [string, pattern, flag]
    var arg = re.match(/^\/(.*)\/(g|i|)$|.*/);
    this.options.grep = new RegExp(arg[1] || arg[0], arg[2]);
  } else {
    this.options.grep = re;
  }
  return this;
};

/**
 * Inverts `grep` matches.
 *
 * @public
 * @see {@link Mocha#grep}
 * @return {Mocha} this
 * @chainable
 * @example
 *
 * // Select tests whose full title does *not* contain `"match"`, ignoring case
 * mocha.grep(/match/i).invert();
 */
Mocha.prototype.invert = function() {
  this.options.invert = true;
  return this;
};

/**
 * Enables or disables checking for global variables leaked while running tests.
 *
 * @public
 * @see [CLI option](../#-check-leaks)
 * @param {boolean} [checkLeaks=true] - Whether to check for global variable leaks.
 * @return {Mocha} this
 * @chainable
 */
Mocha.prototype.checkLeaks = function(checkLeaks) {
  this.options.checkLeaks = checkLeaks !== false;
  return this;
};

/**
 * Enables or disables whether or not to dispose after each test run.
 * Disable this to ensure you can run the test suite multiple times.
 * If disabled, be sure to dispose mocha when you're done to prevent memory leaks.
 * @public
 * @see {@link Mocha#dispose}
 * @param {boolean} cleanReferencesAfterRun
 * @return {Mocha} this
 * @chainable
 */
Mocha.prototype.cleanReferencesAfterRun = function(cleanReferencesAfterRun) {
  this._cleanReferencesAfterRun = cleanReferencesAfterRun !== false;
  return this;
};

/**
 * Manually dispose this mocha instance. Mark this instance as `disposed` and unable to run more tests.
 * It also removes function references to tests functions and hooks, so variables trapped in closures can be cleaned by the garbage collector.
 * @public
 */
Mocha.prototype.dispose = function() {
  if (this._state === mochaStates.RUNNING) {
    throw createMochaInstanceAlreadyRunningError(
      'Cannot dispose while the mocha instance is still running tests.'
    );
  }
  this.unloadFiles();
  this._previousRunner && this._previousRunner.dispose();
  this.suite.dispose();
  this._state = mochaStates.DISPOSED;
};

/**
 * Displays full stack trace upon test failure.
 *
 * @public
 * @see [CLI option](../#-full-trace)
 * @param {boolean} [fullTrace=true] - Whether to print full stacktrace upon failure.
 * @return {Mocha} this
 * @chainable
 */
Mocha.prototype.fullTrace = function(fullTrace) {
  this.options.fullTrace = fullTrace !== false;
  return this;
};

/**
 * Enables desktop notification support if prerequisite software installed.
 *
 * @public
 * @see [CLI option](../#-growl-g)
 * @return {Mocha} this
 * @chainable
 */
Mocha.prototype.growl = function() {
  this.options.growl = this.isGrowlCapable();
  if (!this.options.growl) {
    var detail = utils.isBrowser()
      ? 'notification support not available in this browser...'
      : 'notification support prerequisites not installed...';
    console.error(detail + ' cannot enable!');
  }
  return this;
};

/**
 * @summary
 * Determines if Growl support seems likely.
 *
 * @description
 * <strong>Not available when run in browser.</strong>
 *
 * @private
 * @see {@link Growl#isCapable}
 * @see {@link Mocha#growl}
 * @return {boolean} whether Growl support can be expected
 */
Mocha.prototype.isGrowlCapable = growl$1.isCapable;

/**
 * Implements desktop notifications using a pseudo-reporter.
 *
 * @private
 * @see {@link Mocha#growl}
 * @see {@link Growl#notify}
 * @param {Runner} runner - Runner instance.
 */
Mocha.prototype._growl = growl$1.notify;

/**
 * Specifies whitelist of variable names to be expected in global scope.
 *
 * @public
 * @see [CLI option](../#-global-variable-name)
 * @see {@link Mocha#checkLeaks}
 * @param {String[]|String} global - Accepted global variable name(s).
 * @return {Mocha} this
 * @chainable
 * @example
 *
 * // Specify variables to be expected in global scope
 * mocha.global(['jQuery', 'MyLib']);
 */
Mocha.prototype.global = function(global) {
  this.options.global = (this.options.global || [])
    .concat(global)
    .filter(Boolean)
    .filter(function(elt, idx, arr) {
      return arr.indexOf(elt) === idx;
    });
  return this;
};
// for backwards compability, 'globals' is an alias of 'global'
Mocha.prototype.globals = Mocha.prototype.global;

/**
 * Enables or disables TTY color output by screen-oriented reporters.
 *
 * @public
 * @see [CLI option](../#-color-c-colors)
 * @param {boolean} [color=true] - Whether to enable color output.
 * @return {Mocha} this
 * @chainable
 */
Mocha.prototype.color = function(color) {
  this.options.color = color !== false;
  return this;
};

/**
 * Enables or disables reporter to use inline diffs (rather than +/-)
 * in test failure output.
 *
 * @public
 * @see [CLI option](../#-inline-diffs)
 * @param {boolean} [inlineDiffs=true] - Whether to use inline diffs.
 * @return {Mocha} this
 * @chainable
 */
Mocha.prototype.inlineDiffs = function(inlineDiffs) {
  this.options.inlineDiffs = inlineDiffs !== false;
  return this;
};

/**
 * Enables or disables reporter to include diff in test failure output.
 *
 * @public
 * @see [CLI option](../#-diff)
 * @param {boolean} [diff=true] - Whether to show diff on failure.
 * @return {Mocha} this
 * @chainable
 */
Mocha.prototype.diff = function(diff) {
  this.options.diff = diff !== false;
  return this;
};

/**
 * @summary
 * Sets timeout threshold value.
 *
 * @description
 * A string argument can use shorthand (such as "2s") and will be converted.
 * If the value is `0`, timeouts will be disabled.
 *
 * @public
 * @see [CLI option](../#-timeout-ms-t-ms)
 * @see [Timeouts](../#timeouts)
 * @param {number|string} msecs - Timeout threshold value.
 * @return {Mocha} this
 * @chainable
 * @example
 *
 * // Sets timeout to one second
 * mocha.timeout(1000);
 * @example
 *
 * // Same as above but using string argument
 * mocha.timeout('1s');
 */
Mocha.prototype.timeout = function(msecs) {
  this.suite.timeout(msecs);
  return this;
};

/**
 * Sets the number of times to retry failed tests.
 *
 * @public
 * @see [CLI option](../#-retries-n)
 * @see [Retry Tests](../#retry-tests)
 * @param {number} retry - Number of times to retry failed tests.
 * @return {Mocha} this
 * @chainable
 * @example
 *
 * // Allow any failed test to retry one more time
 * mocha.retries(1);
 */
Mocha.prototype.retries = function(retry) {
  this.suite.retries(retry);
  return this;
};

/**
 * Sets slowness threshold value.
 *
 * @public
 * @see [CLI option](../#-slow-ms-s-ms)
 * @param {number} msecs - Slowness threshold value.
 * @return {Mocha} this
 * @chainable
 * @example
 *
 * // Sets "slow" threshold to half a second
 * mocha.slow(500);
 * @example
 *
 * // Same as above but using string argument
 * mocha.slow('0.5s');
 */
Mocha.prototype.slow = function(msecs) {
  this.suite.slow(msecs);
  return this;
};

/**
 * Forces all tests to either accept a `done` callback or return a promise.
 *
 * @public
 * @see [CLI option](../#-async-only-a)
 * @param {boolean} [asyncOnly=true] - Wether to force `done` callback or promise.
 * @return {Mocha} this
 * @chainable
 */
Mocha.prototype.asyncOnly = function(asyncOnly) {
  this.options.asyncOnly = asyncOnly !== false;
  return this;
};

/**
 * Disables syntax highlighting (in browser).
 *
 * @public
 * @return {Mocha} this
 * @chainable
 */
Mocha.prototype.noHighlighting = function() {
  this.options.noHighlighting = true;
  return this;
};

/**
 * Enables or disables uncaught errors to propagate.
 *
 * @public
 * @see [CLI option](../#-allow-uncaught)
 * @param {boolean} [allowUncaught=true] - Whether to propagate uncaught errors.
 * @return {Mocha} this
 * @chainable
 */
Mocha.prototype.allowUncaught = function(allowUncaught) {
  this.options.allowUncaught = allowUncaught !== false;
  return this;
};

/**
 * @summary
 * Delays root suite execution.
 *
 * @description
 * Used to perform asynch operations before any suites are run.
 *
 * @public
 * @see [delayed root suite](../#delayed-root-suite)
 * @returns {Mocha} this
 * @chainable
 */
Mocha.prototype.delay = function delay() {
  this.options.delay = true;
  return this;
};

/**
 * Causes tests marked `only` to fail the suite.
 *
 * @public
 * @see [CLI option](../#-forbid-only)
 * @param {boolean} [forbidOnly=true] - Whether tests marked `only` fail the suite.
 * @returns {Mocha} this
 * @chainable
 */
Mocha.prototype.forbidOnly = function(forbidOnly) {
  this.options.forbidOnly = forbidOnly !== false;
  return this;
};

/**
 * Causes pending tests and tests marked `skip` to fail the suite.
 *
 * @public
 * @see [CLI option](../#-forbid-pending)
 * @param {boolean} [forbidPending=true] - Whether pending tests fail the suite.
 * @returns {Mocha} this
 * @chainable
 */
Mocha.prototype.forbidPending = function(forbidPending) {
  this.options.forbidPending = forbidPending !== false;
  return this;
};

/**
 * Throws an error if mocha is in the wrong state to be able to transition to a "running" state.
 * @private
 */
Mocha.prototype._guardRunningStateTransition = function() {
  if (this._state === mochaStates.RUNNING) {
    throw createMochaInstanceAlreadyRunningError(
      'Mocha instance is currently running tests, cannot start a next test run until this one is done',
      this
    );
  }
  if (
    this._state === mochaStates.DISPOSED ||
    this._state === mochaStates.REFERENCES_CLEANED
  ) {
    throw createMochaInstanceAlreadyDisposedError(
      'Mocha instance is already disposed, cannot start a new test run. Please create a new mocha instance. Be sure to set disable `cleanReferencesAfterRun` when you want to reuse the same mocha instance for multiple test runs.',
      this._cleanReferencesAfterRun,
      this
    );
  }
};

/**
 * Mocha version as specified by "package.json".
 *
 * @name Mocha#version
 * @type string
 * @readonly
 */
Object.defineProperty(Mocha.prototype, 'version', {
  value: require$$8.version,
  configurable: false,
  enumerable: true,
  writable: false
});

/**
 * Callback to be invoked when test execution is complete.
 *
 * @private
 * @callback DoneCB
 * @param {number} failures - Number of failures that occurred.
 */

/**
 * Runs root suite and invokes `fn()` when complete.
 *
 * @description
 * To run tests multiple times (or to run tests in files that are
 * already in the `require` cache), make sure to clear them from
 * the cache first!
 *
 * @public
 * @see {@link Mocha#unloadFiles}
 * @see {@link Runner#run}
 * @param {DoneCB} [fn] - Callback invoked when test execution completed.
 * @returns {Runner} runner instance
 * @example
 *
 * // exit with non-zero status if there were test failures
 * mocha.run(failures => process.exitCode = failures ? 1 : 0);
 */
Mocha.prototype.run = function(fn) {
  this._guardRunningStateTransition();
  this._state = mochaStates.RUNNING;
  if (this._previousRunner) {
    this._previousRunner.dispose();
    this.suite.reset();
  }
  if (this.files.length && !this._lazyLoadFiles) {
    this.loadFiles();
  }
  var self = this;
  var suite = this.suite;
  var options = this.options;
  options.files = this.files;
  var runner = new this._runnerClass(suite, {
    delay: options.delay,
    cleanReferencesAfterRun: this._cleanReferencesAfterRun
  });
  statsCollector(runner);
  var reporter = new this._reporter(runner, options);
  runner.checkLeaks = options.checkLeaks === true;
  runner.fullStackTrace = options.fullTrace;
  runner.asyncOnly = options.asyncOnly;
  runner.allowUncaught = options.allowUncaught;
  runner.forbidOnly = options.forbidOnly;
  runner.forbidPending = options.forbidPending;
  if (options.grep) {
    runner.grep(options.grep, options.invert);
  }
  if (options.global) {
    runner.globals(options.global);
  }
  if (options.growl) {
    this._growl(runner);
  }
  if (options.color !== undefined) {
    exports.reporters.Base.useColors = options.color;
  }
  exports.reporters.Base.inlineDiffs = options.inlineDiffs;
  exports.reporters.Base.hideDiff = !options.diff;

  function done(failures) {
    self._previousRunner = runner;
    if (self._cleanReferencesAfterRun) {
      self._state = mochaStates.REFERENCES_CLEANED;
    } else {
      self._state = mochaStates.INIT;
    }
    fn = fn || utils.noop;
    if (reporter.done) {
      reporter.done(failures, fn);
    } else {
      fn(failures);
    }
  }

  return runner.run(done, {files: this.files, options: options});
};

/**
 * Assigns hooks to the root suite
 * @param {MochaRootHookObject} [hooks] - Hooks to assign to root suite
 * @chainable
 */
Mocha.prototype.rootHooks = function rootHooks(hooks) {
  if (utils.type(hooks) === 'object') {
    var beforeAll = [].concat(hooks.beforeAll || []);
    var beforeEach = [].concat(hooks.beforeEach || []);
    var afterAll = [].concat(hooks.afterAll || []);
    var afterEach = [].concat(hooks.afterEach || []);
    var rootSuite = this.suite;
    beforeAll.forEach(function(hook) {
      rootSuite.beforeAll(hook);
    });
    beforeEach.forEach(function(hook) {
      rootSuite.beforeEach(hook);
    });
    afterAll.forEach(function(hook) {
      rootSuite.afterAll(hook);
    });
    afterEach.forEach(function(hook) {
      rootSuite.afterEach(hook);
    });
  }
  return this;
};

/**
 * Toggles parallel mode.
 *
 * Must be run before calling {@link Mocha#run}. Changes the `Runner` class to
 * use; also enables lazy file loading if not already done so.
 * @param {boolean} [enable] - If `true`, enable; otherwise disable.
 * @throws If run in browser
 * @throws If Mocha not in "INIT" state
 * @returns {Mocha}
 * @chainable
 * @public
 */
Mocha.prototype.parallelMode = function parallelMode(enable) {
  if (utils.isBrowser()) {
    throw errors.createUnsupportedError(
      'parallel mode is only supported in Node.js'
    );
  }
  var parallel = enable === true;
  if (
    parallel === this.options.parallel &&
    this._lazyLoadFiles &&
    this._runnerClass !== exports.Runner
  ) {
    return this;
  }
  if (this._state !== mochaStates.INIT) {
    throw errors.createUnsupportedError(
      'cannot change parallel mode after having called run()'
    );
  }
  this.options.parallel = parallel;

  // swap Runner class
  this._runnerClass = parallel
    ? parallelBufferedRunner
    : exports.Runner;

  // lazyLoadFiles may have been set `true` otherwise (for ESM loading),
  // so keep `true` if so.
  return this.lazyLoadFiles(this._lazyLoadFiles || parallel);
};

/**
 * Disables implicit call to {@link Mocha#loadFiles} in {@link Mocha#run}. This
 * setting is used by watch mode, parallel mode, and for loading ESM files.
 * @todo This should throw if we've already loaded files; such behavior
 * necessitates adding a new state.
 * @param {boolean} [enable] - If `true`, disable eager loading of files in
 * {@link Mocha#run}
 * @chainable
 * @public
 */
Mocha.prototype.lazyLoadFiles = function lazyLoadFiles(enable) {
  this._lazyLoadFiles = enable === true;
  debug('set lazy load to %s', enable);
  return this;
};

/**
 * An alternative way to define root hooks that works with parallel runs.
 * @private
 * @typedef {Object} MochaRootHookObject
 * @property {Function|Function[]} [beforeAll] - "Before all" hook(s)
 * @property {Function|Function[]} [beforeEach] - "Before each" hook(s)
 * @property {Function|Function[]} [afterAll] - "After all" hook(s)
 * @property {Function|Function[]} [afterEach] - "After each" hook(s)
 */

/**
 * An function that returns a {@link MochaRootHookObject}, either sync or async.
 * @private
 * @callback MochaRootHookFunction
 * @returns {MochaRootHookObject|Promise<MochaRootHookObject>}
 */
});
