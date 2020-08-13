import path from 'path';

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

var build = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.replacePathSepForRegex = exports.escapeStrForRegex = exports.escapePathForRegex = void 0;



/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const escapePathForRegex = dir => {
  if (path.sep === '\\') {
    // Replace "\" with "/" so it's not escaped by escapeStrForRegex.
    // replacePathSepForRegex will convert it back.
    dir = dir.replace(/\\/g, '/');
  }

  return replacePathSepForRegex(escapeStrForRegex(dir));
};

exports.escapePathForRegex = escapePathForRegex;

const escapeStrForRegex = string =>
  string.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');

exports.escapeStrForRegex = escapeStrForRegex;

const replacePathSepForRegex = string => {
  if (path.sep === '\\') {
    return string.replace(
      /(\/|(.)?\\(?![[\]{}()*+?.^$|\\]))/g,
      (_match, _, p2) => (p2 && p2 !== '\\' ? p2 + '\\\\' : '\\\\')
    );
  }

  return string;
};

exports.replacePathSepForRegex = replacePathSepForRegex;
});
