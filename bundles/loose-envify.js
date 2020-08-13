import stream from 'stream';
import util from 'util';

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

var jsTokens = createCommonjsModule(function (module, exports) {
// Copyright 2014, 2015, 2016, 2017, 2018 Simon Lydell
// License: MIT. (See LICENSE.)

Object.defineProperty(exports, "__esModule", {
  value: true
});

// This regex comes from regex.coffee, and is inserted here by generate-index.js
// (run `npm run build`).
exports.default = /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\}?)*\}?)*(`)?)|(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)|(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*\]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyus]{1,6}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))|(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)|((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+)|(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-\/%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])|(\s+)|(^$|[\s\S])/g;

exports.matchToToken = function(match) {
  var token = {type: "invalid", value: match[0], closed: undefined};
       if (match[ 1]) token.type = "string" , token.closed = !!(match[3] || match[4]);
  else if (match[ 5]) token.type = "comment";
  else if (match[ 6]) token.type = "comment", token.closed = !!match[7];
  else if (match[ 8]) token.type = "regex";
  else if (match[ 9]) token.type = "number";
  else if (match[10]) token.type = "name";
  else if (match[11]) token.type = "punctuator";
  else if (match[12]) token.type = "whitespace";
  return token
};
});

var jsTokens$1 = jsTokens.default;

var processEnvRe = /\bprocess\.env\.[_$a-zA-Z][$\w]+\b/;
var spaceOrCommentRe = /^(?:\s|\/[/*])/;

function replace(src, envs) {
  if (!processEnvRe.test(src)) {
    return src;
  }

  var out = [];
  var purge = envs.some(function(env) {
    return env._ && env._.indexOf('purge') !== -1;
  });

  jsTokens$1.lastIndex = 0;
  var parts = src.match(jsTokens$1);

  for (var i = 0; i < parts.length; i++) {
    if (parts[i    ] === 'process' &&
        parts[i + 1] === '.' &&
        parts[i + 2] === 'env' &&
        parts[i + 3] === '.') {
      var prevCodeToken = getAdjacentCodeToken(-1, parts, i);
      var nextCodeToken = getAdjacentCodeToken(1, parts, i + 4);
      var replacement = getReplacementString(envs, parts[i + 4], purge);
      if (prevCodeToken !== '.' &&
          nextCodeToken !== '.' &&
          nextCodeToken !== '=' &&
          typeof replacement === 'string') {
        out.push(replacement);
        i += 4;
        continue;
      }
    }
    out.push(parts[i]);
  }

  return out.join('');
}

function getAdjacentCodeToken(dir, parts, i) {
  while (true) {
    var part = parts[i += dir];
    if (!spaceOrCommentRe.test(part)) {
      return part;
    }
  }
}

function getReplacementString(envs, name, purge) {
  for (var j = 0; j < envs.length; j++) {
    var env = envs[j];
    if (typeof env[name] !== 'undefined') {
      return JSON.stringify(env[name]);
    }
  }
  if (purge) {
    return 'undefined';
  }
}

var replace_1 = replace;

var jsonExtRe = /\.json$/;

var looseEnvify = function(rootEnv) {
  rootEnv = rootEnv || process.env;
  return function (file, trOpts) {
    if (jsonExtRe.test(file)) {
      return stream.PassThrough();
    }
    var envs = trOpts ? [rootEnv, trOpts] : [rootEnv];
    return new LooseEnvify(envs);
  };
};

function LooseEnvify(envs) {
  stream.Transform.call(this);
  this._data = '';
  this._envs = envs;
}
util.inherits(LooseEnvify, stream.Transform);

LooseEnvify.prototype._transform = function(buf, enc, cb) {
  this._data += buf;
  cb();
};

LooseEnvify.prototype._flush = function(cb) {
  var replaced = replace_1(this._data, this._envs);
  this.push(replaced);
  cb();
};

var looseEnvify$1 = looseEnvify(process.env);
