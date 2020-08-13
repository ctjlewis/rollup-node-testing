import http from 'http';
import url from 'url';

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

var httpsBrowserify = createCommonjsModule(function (module) {
var https = module.exports;

for (var key in http) {
  if (http.hasOwnProperty(key)) https[key] = http[key];
}

https.request = function (params, cb) {
  params = validateParams(params);
  return http.request.call(this, params, cb)
};

https.get = function (params, cb) {
  params = validateParams(params);
  return http.get.call(this, params, cb)
};

function validateParams (params) {
  if (typeof params === 'string') {
    params = url.parse(params);
  }
  if (!params.protocol) {
    params.protocol = 'https:';
  }
  if (params.protocol !== 'https:') {
    throw new Error('Protocol "' + params.protocol + '" not supported. Expected "https:"')
  }
  return params
}
});
