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

var gitHostInfo = createCommonjsModule(function (module) {

var gitHosts = module.exports = {
  github: {
    // First two are insecure and generally shouldn't be used any more, but
    // they are still supported.
    'protocols': [ 'git', 'http', 'git+ssh', 'git+https', 'ssh', 'https' ],
    'domain': 'github.com',
    'treepath': 'tree',
    'filetemplate': 'https://{auth@}raw.githubusercontent.com/{user}/{project}/{committish}/{path}',
    'bugstemplate': 'https://{domain}/{user}/{project}/issues',
    'gittemplate': 'git://{auth@}{domain}/{user}/{project}.git{#committish}',
    'tarballtemplate': 'https://codeload.{domain}/{user}/{project}/tar.gz/{committish}'
  },
  bitbucket: {
    'protocols': [ 'git+ssh', 'git+https', 'ssh', 'https' ],
    'domain': 'bitbucket.org',
    'treepath': 'src',
    'tarballtemplate': 'https://{domain}/{user}/{project}/get/{committish}.tar.gz'
  },
  gitlab: {
    'protocols': [ 'git+ssh', 'git+https', 'ssh', 'https' ],
    'domain': 'gitlab.com',
    'treepath': 'tree',
    'bugstemplate': 'https://{domain}/{user}/{project}/issues',
    'httpstemplate': 'git+https://{auth@}{domain}/{user}/{projectPath}.git{#committish}',
    'tarballtemplate': 'https://{domain}/{user}/{project}/repository/archive.tar.gz?ref={committish}',
    'pathmatch': /^[/]([^/]+)[/]((?!.*(\/-\/|\/repository\/archive\.tar\.gz\?=.*|\/repository\/[^/]+\/archive.tar.gz$)).*?)(?:[.]git|[/])?$/
  },
  gist: {
    'protocols': [ 'git', 'git+ssh', 'git+https', 'ssh', 'https' ],
    'domain': 'gist.github.com',
    'pathmatch': /^[/](?:([^/]+)[/])?([a-z0-9]{32,})(?:[.]git)?$/,
    'filetemplate': 'https://gist.githubusercontent.com/{user}/{project}/raw{/committish}/{path}',
    'bugstemplate': 'https://{domain}/{project}',
    'gittemplate': 'git://{domain}/{project}.git{#committish}',
    'sshtemplate': 'git@{domain}:/{project}.git{#committish}',
    'sshurltemplate': 'git+ssh://git@{domain}/{project}.git{#committish}',
    'browsetemplate': 'https://{domain}/{project}{/committish}',
    'browsefiletemplate': 'https://{domain}/{project}{/committish}{#path}',
    'docstemplate': 'https://{domain}/{project}{/committish}',
    'httpstemplate': 'git+https://{domain}/{project}.git{#committish}',
    'shortcuttemplate': '{type}:{project}{#committish}',
    'pathtemplate': '{project}{#committish}',
    'tarballtemplate': 'https://codeload.github.com/gist/{project}/tar.gz/{committish}',
    'hashformat': function (fragment) {
      return 'file-' + formatHashFragment(fragment)
    }
  }
};

var gitHostDefaults = {
  'sshtemplate': 'git@{domain}:{user}/{project}.git{#committish}',
  'sshurltemplate': 'git+ssh://git@{domain}/{user}/{project}.git{#committish}',
  'browsetemplate': 'https://{domain}/{user}/{project}{/tree/committish}',
  'browsefiletemplate': 'https://{domain}/{user}/{project}/{treepath}/{committish}/{path}{#fragment}',
  'docstemplate': 'https://{domain}/{user}/{project}{/tree/committish}#readme',
  'httpstemplate': 'git+https://{auth@}{domain}/{user}/{project}.git{#committish}',
  'filetemplate': 'https://{domain}/{user}/{project}/raw/{committish}/{path}',
  'shortcuttemplate': '{type}:{user}/{project}{#committish}',
  'pathtemplate': '{user}/{project}{#committish}',
  'pathmatch': /^[/]([^/]+)[/]([^/]+?)(?:[.]git|[/])?$/,
  'hashformat': formatHashFragment
};

Object.keys(gitHosts).forEach(function (name) {
  Object.keys(gitHostDefaults).forEach(function (key) {
    if (gitHosts[name][key]) return
    gitHosts[name][key] = gitHostDefaults[key];
  });
  gitHosts[name].protocols_re = RegExp('^(' +
    gitHosts[name].protocols.map(function (protocol) {
      return protocol.replace(/([\\+*{}()[\]$^|])/g, '\\$1')
    }).join('|') + '):$');
});

function formatHashFragment (fragment) {
  return fragment.toLowerCase().replace(/^\W+|\/|\W+$/g, '').replace(/\W+/g, '-')
}
});

/* eslint-disable node/no-deprecated-api */

// copy-pasta util._extend from node's source, to avoid pulling
// the whole util module into peoples' webpack bundles.
/* istanbul ignore next */
var extend = Object.assign || function _extend (target, source) {
  // Don't do anything if source isn't an object
  if (source === null || typeof source !== 'object') return target

  var keys = Object.keys(source);
  var i = keys.length;
  while (i--) {
    target[keys[i]] = source[keys[i]];
  }
  return target
};

var gitHost = GitHost;
function GitHost (type, user, auth, project, committish, defaultRepresentation, opts) {
  var gitHostInfo$1 = this;
  gitHostInfo$1.type = type;
  Object.keys(gitHostInfo[type]).forEach(function (key) {
    gitHostInfo$1[key] = gitHostInfo[type][key];
  });
  gitHostInfo$1.user = user;
  gitHostInfo$1.auth = auth;
  gitHostInfo$1.project = project;
  gitHostInfo$1.committish = committish;
  gitHostInfo$1.default = defaultRepresentation;
  gitHostInfo$1.opts = opts || {};
}

GitHost.prototype.hash = function () {
  return this.committish ? '#' + this.committish : ''
};

GitHost.prototype._fill = function (template, opts) {
  if (!template) return
  var vars = extend({}, opts);
  vars.path = vars.path ? vars.path.replace(/^[/]+/g, '') : '';
  opts = extend(extend({}, this.opts), opts);
  var self = this;
  Object.keys(this).forEach(function (key) {
    if (self[key] != null && vars[key] == null) vars[key] = self[key];
  });
  var rawAuth = vars.auth;
  var rawcommittish = vars.committish;
  var rawFragment = vars.fragment;
  var rawPath = vars.path;
  var rawProject = vars.project;
  Object.keys(vars).forEach(function (key) {
    var value = vars[key];
    if ((key === 'path' || key === 'project') && typeof value === 'string') {
      vars[key] = value.split('/').map(function (pathComponent) {
        return encodeURIComponent(pathComponent)
      }).join('/');
    } else {
      vars[key] = encodeURIComponent(value);
    }
  });
  vars['auth@'] = rawAuth ? rawAuth + '@' : '';
  vars['#fragment'] = rawFragment ? '#' + this.hashformat(rawFragment) : '';
  vars.fragment = vars.fragment ? vars.fragment : '';
  vars['#path'] = rawPath ? '#' + this.hashformat(rawPath) : '';
  vars['/path'] = vars.path ? '/' + vars.path : '';
  vars.projectPath = rawProject.split('/').map(encodeURIComponent).join('/');
  if (opts.noCommittish) {
    vars['#committish'] = '';
    vars['/tree/committish'] = '';
    vars['/committish'] = '';
    vars.committish = '';
  } else {
    vars['#committish'] = rawcommittish ? '#' + rawcommittish : '';
    vars['/tree/committish'] = vars.committish
      ? '/' + vars.treepath + '/' + vars.committish
      : '';
    vars['/committish'] = vars.committish ? '/' + vars.committish : '';
    vars.committish = vars.committish || 'master';
  }
  var res = template;
  Object.keys(vars).forEach(function (key) {
    res = res.replace(new RegExp('[{]' + key + '[}]', 'g'), vars[key]);
  });
  if (opts.noGitPlus) {
    return res.replace(/^git[+]/, '')
  } else {
    return res
  }
};

GitHost.prototype.ssh = function (opts) {
  return this._fill(this.sshtemplate, opts)
};

GitHost.prototype.sshurl = function (opts) {
  return this._fill(this.sshurltemplate, opts)
};

GitHost.prototype.browse = function (P, F, opts) {
  if (typeof P === 'string') {
    if (typeof F !== 'string') {
      opts = F;
      F = null;
    }
    return this._fill(this.browsefiletemplate, extend({
      fragment: F,
      path: P
    }, opts))
  } else {
    return this._fill(this.browsetemplate, P)
  }
};

GitHost.prototype.docs = function (opts) {
  return this._fill(this.docstemplate, opts)
};

GitHost.prototype.bugs = function (opts) {
  return this._fill(this.bugstemplate, opts)
};

GitHost.prototype.https = function (opts) {
  return this._fill(this.httpstemplate, opts)
};

GitHost.prototype.git = function (opts) {
  return this._fill(this.gittemplate, opts)
};

GitHost.prototype.shortcut = function (opts) {
  return this._fill(this.shortcuttemplate, opts)
};

GitHost.prototype.path = function (opts) {
  return this._fill(this.pathtemplate, opts)
};

GitHost.prototype.tarball = function (opts_) {
  var opts = extend({}, opts_, { noCommittish: false });
  return this._fill(this.tarballtemplate, opts)
};

GitHost.prototype.file = function (P, opts) {
  return this._fill(this.filetemplate, extend({ path: P }, opts))
};

GitHost.prototype.getDefaultRepresentation = function () {
  return this.default
};

GitHost.prototype.toString = function (opts) {
  if (this.default && typeof this[this.default] === 'function') return this[this.default](opts)
  return this.sshurl(opts)
};

var hostedGitInfo = createCommonjsModule(function (module) {


var GitHost = module.exports = gitHost;

var protocolToRepresentationMap = {
  'git+ssh:': 'sshurl',
  'git+https:': 'https',
  'ssh:': 'sshurl',
  'git:': 'git'
};

function protocolToRepresentation (protocol) {
  return protocolToRepresentationMap[protocol] || protocol.slice(0, -1)
}

var authProtocols = {
  'git:': true,
  'https:': true,
  'git+https:': true,
  'http:': true,
  'git+http:': true
};

var cache = {};

module.exports.fromUrl = function (giturl, opts) {
  if (typeof giturl !== 'string') return
  var key = giturl + JSON.stringify(opts || {});

  if (!(key in cache)) {
    cache[key] = fromUrl(giturl, opts);
  }

  return cache[key]
};

function fromUrl (giturl, opts) {
  if (giturl == null || giturl === '') return
  var url = fixupUnqualifiedGist(
    isGitHubShorthand(giturl) ? 'github:' + giturl : giturl
  );
  var parsed = parseGitUrl(url);
  var shortcutMatch = url.match(new RegExp('^([^:]+):(?:(?:[^@:]+(?:[^@]+)?@)?([^/]*))[/](.+?)(?:[.]git)?($|#)'));
  var matches = Object.keys(gitHostInfo).map(function (gitHostName) {
    try {
      var gitHostInfo$1 = gitHostInfo[gitHostName];
      var auth = null;
      if (parsed.auth && authProtocols[parsed.protocol]) {
        auth = parsed.auth;
      }
      var committish = parsed.hash ? decodeURIComponent(parsed.hash.substr(1)) : null;
      var user = null;
      var project = null;
      var defaultRepresentation = null;
      if (shortcutMatch && shortcutMatch[1] === gitHostName) {
        user = shortcutMatch[2] && decodeURIComponent(shortcutMatch[2]);
        project = decodeURIComponent(shortcutMatch[3]);
        defaultRepresentation = 'shortcut';
      } else {
        if (parsed.host && parsed.host !== gitHostInfo$1.domain && parsed.host.replace(/^www[.]/, '') !== gitHostInfo$1.domain) return
        if (!gitHostInfo$1.protocols_re.test(parsed.protocol)) return
        if (!parsed.path) return
        var pathmatch = gitHostInfo$1.pathmatch;
        var matched = parsed.path.match(pathmatch);
        if (!matched) return
        /* istanbul ignore else */
        if (matched[1] !== null && matched[1] !== undefined) {
          user = decodeURIComponent(matched[1].replace(/^:/, ''));
        }
        project = decodeURIComponent(matched[2]);
        defaultRepresentation = protocolToRepresentation(parsed.protocol);
      }
      return new GitHost(gitHostName, user, auth, project, committish, defaultRepresentation, opts)
    } catch (ex) {
      /* istanbul ignore else */
      if (ex instanceof URIError) ; else throw ex
    }
  }).filter(function (gitHostInfo) { return gitHostInfo });
  if (matches.length !== 1) return
  return matches[0]
}

function isGitHubShorthand (arg) {
  // Note: This does not fully test the git ref format.
  // See https://www.kernel.org/pub/software/scm/git/docs/git-check-ref-format.html
  //
  // The only way to do this properly would be to shell out to
  // git-check-ref-format, and as this is a fast sync function,
  // we don't want to do that.  Just let git fail if it turns
  // out that the commit-ish is invalid.
  // GH usernames cannot start with . or -
  return /^[^:@%/\s.-][^:@%/\s]*[/][^:@\s/%]+(?:#.*)?$/.test(arg)
}

function fixupUnqualifiedGist (giturl) {
  // necessary for round-tripping gists
  var parsed = url.parse(giturl);
  if (parsed.protocol === 'gist:' && parsed.host && !parsed.path) {
    return parsed.protocol + '/' + parsed.host
  } else {
    return giturl
  }
}

function parseGitUrl (giturl) {
  var matched = giturl.match(/^([^@]+)@([^:/]+):[/]?((?:[^/]+[/])?[^/]+?)(?:[.]git)?(#.*)?$/);
  if (!matched) {
    var legacy = url.parse(giturl);
    // If we don't have url.URL, then sorry, this is just not fixable.
    // This affects Node <= 6.12.
    if (legacy.auth && typeof url.URL === 'function') {
      // git urls can be in the form of scp-style/ssh-connect strings, like
      // git+ssh://user@host.com:some/path, which the legacy url parser
      // supports, but WhatWG url.URL class does not.  However, the legacy
      // parser de-urlencodes the username and password, so something like
      // https://user%3An%40me:p%40ss%3Aword@x.com/ becomes
      // https://user:n@me:p@ss:word@x.com/ which is all kinds of wrong.
      // Pull off just the auth and host, so we dont' get the confusing
      // scp-style URL, then pass that to the WhatWG parser to get the
      // auth properly escaped.
      var authmatch = giturl.match(/[^@]+@[^:/]+/);
      /* istanbul ignore else - this should be impossible */
      if (authmatch) {
        var whatwg = new url.URL(authmatch[0]);
        legacy.auth = whatwg.username || '';
        if (whatwg.password) legacy.auth += ':' + whatwg.password;
      }
    }
    return legacy
  }
  return {
    protocol: 'git+ssh:',
    slashes: true,
    auth: matched[1],
    host: matched[2],
    port: null,
    hostname: matched[2],
    hash: matched[4],
    search: null,
    query: null,
    pathname: '/' + matched[3],
    path: '/' + matched[3],
    href: 'git+ssh://' + matched[1] + '@' + matched[2] +
          '/' + matched[3] + (matched[4] || '')
  }
}
});
