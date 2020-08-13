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

var acl = {
	arity: -2,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale",
		"skip_slowlog"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var append = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var asking = {
	arity: 1,
	flags: [
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var auth = {
	arity: -2,
	flags: [
		"noscript",
		"loading",
		"stale",
		"skip_monitor",
		"skip_slowlog",
		"fast",
		"no_auth"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var bgrewriteaof = {
	arity: 1,
	flags: [
		"admin",
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var bgsave = {
	arity: -1,
	flags: [
		"admin",
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var bitcount = {
	arity: -2,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var bitfield = {
	arity: -2,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var bitfield_ro = {
	arity: -2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var bitop = {
	arity: -4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 2,
	keyStop: -1,
	step: 1
};
var bitpos = {
	arity: -3,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var blpop = {
	arity: -3,
	flags: [
		"write",
		"noscript"
	],
	keyStart: 1,
	keyStop: -2,
	step: 1
};
var brpop = {
	arity: -3,
	flags: [
		"write",
		"noscript"
	],
	keyStart: 1,
	keyStop: -2,
	step: 1
};
var brpoplpush = {
	arity: 4,
	flags: [
		"write",
		"denyoom",
		"noscript"
	],
	keyStart: 1,
	keyStop: 2,
	step: 1
};
var bzpopmax = {
	arity: -3,
	flags: [
		"write",
		"noscript",
		"fast"
	],
	keyStart: 1,
	keyStop: -2,
	step: 1
};
var bzpopmin = {
	arity: -3,
	flags: [
		"write",
		"noscript",
		"fast"
	],
	keyStart: 1,
	keyStop: -2,
	step: 1
};
var client = {
	arity: -2,
	flags: [
		"admin",
		"noscript",
		"random",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var cluster = {
	arity: -2,
	flags: [
		"admin",
		"random",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var command = {
	arity: -1,
	flags: [
		"random",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var config = {
	arity: -2,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var dbsize = {
	arity: 1,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var debug = {
	arity: -2,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var decr = {
	arity: 2,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var decrby = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var del = {
	arity: -2,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var discard = {
	arity: 1,
	flags: [
		"noscript",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var dump = {
	arity: 2,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var echo = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var evalsha = {
	arity: -3,
	flags: [
		"noscript",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var exec = {
	arity: 1,
	flags: [
		"noscript",
		"loading",
		"stale",
		"skip_monitor",
		"skip_slowlog"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var exists = {
	arity: -2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var expire = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var expireat = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var flushall = {
	arity: -1,
	flags: [
		"write"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var flushdb = {
	arity: -1,
	flags: [
		"write"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var geoadd = {
	arity: -5,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var geodist = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var geohash = {
	arity: -2,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var geopos = {
	arity: -2,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var georadius = {
	arity: -6,
	flags: [
		"write",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var georadius_ro = {
	arity: -6,
	flags: [
		"readonly",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var georadiusbymember = {
	arity: -5,
	flags: [
		"write",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var georadiusbymember_ro = {
	arity: -5,
	flags: [
		"readonly",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var get = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var getbit = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var getrange = {
	arity: 4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var getset = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hdel = {
	arity: -3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hello = {
	arity: -2,
	flags: [
		"noscript",
		"loading",
		"stale",
		"skip_monitor",
		"skip_slowlog",
		"fast",
		"no_auth"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var hexists = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hget = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hgetall = {
	arity: 2,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hincrby = {
	arity: 4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hincrbyfloat = {
	arity: 4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hkeys = {
	arity: 2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hlen = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hmget = {
	arity: -3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hmset = {
	arity: -4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hscan = {
	arity: -3,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hset = {
	arity: -4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hsetnx = {
	arity: 4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hstrlen = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hvals = {
	arity: 2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var incr = {
	arity: 2,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var incrby = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var incrbyfloat = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var info = {
	arity: -1,
	flags: [
		"random",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var keys = {
	arity: 2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var lastsave = {
	arity: 1,
	flags: [
		"readonly",
		"random",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var latency = {
	arity: -2,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var lindex = {
	arity: 3,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var linsert = {
	arity: 5,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var llen = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lolwut = {
	arity: -1,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var lpop = {
	arity: 2,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lpos = {
	arity: -3,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lpush = {
	arity: -3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lpushx = {
	arity: -3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lrange = {
	arity: 4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lrem = {
	arity: 4,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lset = {
	arity: 4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var ltrim = {
	arity: 4,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var memory = {
	arity: -2,
	flags: [
		"readonly",
		"random",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var mget = {
	arity: -2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var migrate = {
	arity: -6,
	flags: [
		"write",
		"random",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var module = {
	arity: -2,
	flags: [
		"admin",
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var monitor = {
	arity: 1,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var move = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var mset = {
	arity: -3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: -1,
	step: 2
};
var msetnx = {
	arity: -3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: -1,
	step: 2
};
var multi = {
	arity: 1,
	flags: [
		"noscript",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var object = {
	arity: -2,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 2,
	keyStop: 2,
	step: 1
};
var persist = {
	arity: 2,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var pexpire = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var pexpireat = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var pfadd = {
	arity: -2,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var pfcount = {
	arity: -2,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var pfdebug = {
	arity: -3,
	flags: [
		"write",
		"admin"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var pfmerge = {
	arity: -2,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var pfselftest = {
	arity: 1,
	flags: [
		"admin"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var ping = {
	arity: -1,
	flags: [
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var post = {
	arity: -1,
	flags: [
		"readonly",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var psetex = {
	arity: 4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var psubscribe = {
	arity: -2,
	flags: [
		"pubsub",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var psync = {
	arity: 3,
	flags: [
		"admin",
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var pttl = {
	arity: 2,
	flags: [
		"readonly",
		"random",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var publish = {
	arity: 3,
	flags: [
		"pubsub",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var pubsub = {
	arity: -2,
	flags: [
		"pubsub",
		"random",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var punsubscribe = {
	arity: -1,
	flags: [
		"pubsub",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var quit = {
	arity: 1,
	flags: [
		"loading",
		"stale",
		"readonly"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var randomkey = {
	arity: 1,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var readonly = {
	arity: 1,
	flags: [
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var readwrite = {
	arity: 1,
	flags: [
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var rename = {
	arity: 3,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: 2,
	step: 1
};
var renamenx = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 2,
	step: 1
};
var replconf = {
	arity: -1,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var replicaof = {
	arity: 3,
	flags: [
		"admin",
		"noscript",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var restore = {
	arity: -4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var role = {
	arity: 1,
	flags: [
		"readonly",
		"noscript",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var rpop = {
	arity: 2,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var rpoplpush = {
	arity: 3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 2,
	step: 1
};
var rpush = {
	arity: -3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var rpushx = {
	arity: -3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var sadd = {
	arity: -3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var save = {
	arity: 1,
	flags: [
		"admin",
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var scan = {
	arity: -2,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var scard = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var script = {
	arity: -2,
	flags: [
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var sdiff = {
	arity: -2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var sdiffstore = {
	arity: -3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var select = {
	arity: 2,
	flags: [
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var set = {
	arity: -3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var setbit = {
	arity: 4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var setex = {
	arity: 4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var setnx = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var setrange = {
	arity: 4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var shutdown = {
	arity: -1,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var sinter = {
	arity: -2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var sinterstore = {
	arity: -3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var sismember = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var slaveof = {
	arity: 3,
	flags: [
		"admin",
		"noscript",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var slowlog = {
	arity: -2,
	flags: [
		"admin",
		"random",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var smembers = {
	arity: 2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var smove = {
	arity: 4,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 2,
	step: 1
};
var sort = {
	arity: -2,
	flags: [
		"write",
		"denyoom",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var spop = {
	arity: -2,
	flags: [
		"write",
		"random",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var srandmember = {
	arity: -2,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var srem = {
	arity: -3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var sscan = {
	arity: -3,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var stralgo = {
	arity: -2,
	flags: [
		"readonly",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var strlen = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var subscribe = {
	arity: -2,
	flags: [
		"pubsub",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var substr = {
	arity: 4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var sunion = {
	arity: -2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var sunionstore = {
	arity: -3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var swapdb = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var sync = {
	arity: 1,
	flags: [
		"admin",
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var time = {
	arity: 1,
	flags: [
		"readonly",
		"random",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var touch = {
	arity: -2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var ttl = {
	arity: 2,
	flags: [
		"readonly",
		"random",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var type = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var unlink = {
	arity: -2,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var unsubscribe = {
	arity: -1,
	flags: [
		"pubsub",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var unwatch = {
	arity: 1,
	flags: [
		"noscript",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var wait = {
	arity: 3,
	flags: [
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var watch = {
	arity: -2,
	flags: [
		"noscript",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var xack = {
	arity: -4,
	flags: [
		"write",
		"random",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xadd = {
	arity: -5,
	flags: [
		"write",
		"denyoom",
		"random",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xclaim = {
	arity: -6,
	flags: [
		"write",
		"random",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xdel = {
	arity: -3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xgroup = {
	arity: -2,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 2,
	keyStop: 2,
	step: 1
};
var xinfo = {
	arity: -2,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 2,
	keyStop: 2,
	step: 1
};
var xlen = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xpending = {
	arity: -3,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xrange = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xread = {
	arity: -4,
	flags: [
		"readonly",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xreadgroup = {
	arity: -7,
	flags: [
		"write",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xrevrange = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xsetid = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xtrim = {
	arity: -2,
	flags: [
		"write",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zadd = {
	arity: -4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zcard = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zcount = {
	arity: 4,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zincrby = {
	arity: 4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zinterstore = {
	arity: -4,
	flags: [
		"write",
		"denyoom",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var zlexcount = {
	arity: 4,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zpopmax = {
	arity: -2,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zpopmin = {
	arity: -2,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrange = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrangebylex = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrangebyscore = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrank = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrem = {
	arity: -3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zremrangebylex = {
	arity: 4,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zremrangebyrank = {
	arity: 4,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zremrangebyscore = {
	arity: 4,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrevrange = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrevrangebylex = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrevrangebyscore = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrevrank = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zscan = {
	arity: -3,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zscore = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zunionstore = {
	arity: -4,
	flags: [
		"write",
		"denyoom",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var commands = {
	acl: acl,
	append: append,
	asking: asking,
	auth: auth,
	bgrewriteaof: bgrewriteaof,
	bgsave: bgsave,
	bitcount: bitcount,
	bitfield: bitfield,
	bitfield_ro: bitfield_ro,
	bitop: bitop,
	bitpos: bitpos,
	blpop: blpop,
	brpop: brpop,
	brpoplpush: brpoplpush,
	bzpopmax: bzpopmax,
	bzpopmin: bzpopmin,
	client: client,
	cluster: cluster,
	command: command,
	config: config,
	dbsize: dbsize,
	debug: debug,
	decr: decr,
	decrby: decrby,
	del: del,
	discard: discard,
	dump: dump,
	echo: echo,
	"eval": {
	arity: -3,
	flags: [
		"noscript",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
},
	evalsha: evalsha,
	exec: exec,
	exists: exists,
	expire: expire,
	expireat: expireat,
	flushall: flushall,
	flushdb: flushdb,
	geoadd: geoadd,
	geodist: geodist,
	geohash: geohash,
	geopos: geopos,
	georadius: georadius,
	georadius_ro: georadius_ro,
	georadiusbymember: georadiusbymember,
	georadiusbymember_ro: georadiusbymember_ro,
	get: get,
	getbit: getbit,
	getrange: getrange,
	getset: getset,
	hdel: hdel,
	hello: hello,
	hexists: hexists,
	hget: hget,
	hgetall: hgetall,
	hincrby: hincrby,
	hincrbyfloat: hincrbyfloat,
	hkeys: hkeys,
	hlen: hlen,
	hmget: hmget,
	hmset: hmset,
	"host:": {
	arity: -1,
	flags: [
		"readonly",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
},
	hscan: hscan,
	hset: hset,
	hsetnx: hsetnx,
	hstrlen: hstrlen,
	hvals: hvals,
	incr: incr,
	incrby: incrby,
	incrbyfloat: incrbyfloat,
	info: info,
	keys: keys,
	lastsave: lastsave,
	latency: latency,
	lindex: lindex,
	linsert: linsert,
	llen: llen,
	lolwut: lolwut,
	lpop: lpop,
	lpos: lpos,
	lpush: lpush,
	lpushx: lpushx,
	lrange: lrange,
	lrem: lrem,
	lset: lset,
	ltrim: ltrim,
	memory: memory,
	mget: mget,
	migrate: migrate,
	module: module,
	monitor: monitor,
	move: move,
	mset: mset,
	msetnx: msetnx,
	multi: multi,
	object: object,
	persist: persist,
	pexpire: pexpire,
	pexpireat: pexpireat,
	pfadd: pfadd,
	pfcount: pfcount,
	pfdebug: pfdebug,
	pfmerge: pfmerge,
	pfselftest: pfselftest,
	ping: ping,
	post: post,
	psetex: psetex,
	psubscribe: psubscribe,
	psync: psync,
	pttl: pttl,
	publish: publish,
	pubsub: pubsub,
	punsubscribe: punsubscribe,
	quit: quit,
	randomkey: randomkey,
	readonly: readonly,
	readwrite: readwrite,
	rename: rename,
	renamenx: renamenx,
	replconf: replconf,
	replicaof: replicaof,
	restore: restore,
	"restore-asking": {
	arity: -4,
	flags: [
		"write",
		"denyoom",
		"asking"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
},
	role: role,
	rpop: rpop,
	rpoplpush: rpoplpush,
	rpush: rpush,
	rpushx: rpushx,
	sadd: sadd,
	save: save,
	scan: scan,
	scard: scard,
	script: script,
	sdiff: sdiff,
	sdiffstore: sdiffstore,
	select: select,
	set: set,
	setbit: setbit,
	setex: setex,
	setnx: setnx,
	setrange: setrange,
	shutdown: shutdown,
	sinter: sinter,
	sinterstore: sinterstore,
	sismember: sismember,
	slaveof: slaveof,
	slowlog: slowlog,
	smembers: smembers,
	smove: smove,
	sort: sort,
	spop: spop,
	srandmember: srandmember,
	srem: srem,
	sscan: sscan,
	stralgo: stralgo,
	strlen: strlen,
	subscribe: subscribe,
	substr: substr,
	sunion: sunion,
	sunionstore: sunionstore,
	swapdb: swapdb,
	sync: sync,
	time: time,
	touch: touch,
	ttl: ttl,
	type: type,
	unlink: unlink,
	unsubscribe: unsubscribe,
	unwatch: unwatch,
	wait: wait,
	watch: watch,
	xack: xack,
	xadd: xadd,
	xclaim: xclaim,
	xdel: xdel,
	xgroup: xgroup,
	xinfo: xinfo,
	xlen: xlen,
	xpending: xpending,
	xrange: xrange,
	xread: xread,
	xreadgroup: xreadgroup,
	xrevrange: xrevrange,
	xsetid: xsetid,
	xtrim: xtrim,
	zadd: zadd,
	zcard: zcard,
	zcount: zcount,
	zincrby: zincrby,
	zinterstore: zinterstore,
	zlexcount: zlexcount,
	zpopmax: zpopmax,
	zpopmin: zpopmin,
	zrange: zrange,
	zrangebylex: zrangebylex,
	zrangebyscore: zrangebyscore,
	zrank: zrank,
	zrem: zrem,
	zremrangebylex: zremrangebylex,
	zremrangebyrank: zremrangebyrank,
	zremrangebyscore: zremrangebyscore,
	zrevrange: zrevrange,
	zrevrangebylex: zrevrangebylex,
	zrevrangebyscore: zrevrangebyscore,
	zrevrank: zrevrank,
	zscan: zscan,
	zscore: zscore,
	zunionstore: zunionstore
};

var commands$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	acl: acl,
	append: append,
	asking: asking,
	auth: auth,
	bgrewriteaof: bgrewriteaof,
	bgsave: bgsave,
	bitcount: bitcount,
	bitfield: bitfield,
	bitfield_ro: bitfield_ro,
	bitop: bitop,
	bitpos: bitpos,
	blpop: blpop,
	brpop: brpop,
	brpoplpush: brpoplpush,
	bzpopmax: bzpopmax,
	bzpopmin: bzpopmin,
	client: client,
	cluster: cluster,
	command: command,
	config: config,
	dbsize: dbsize,
	debug: debug,
	decr: decr,
	decrby: decrby,
	del: del,
	discard: discard,
	dump: dump,
	echo: echo,
	evalsha: evalsha,
	exec: exec,
	exists: exists,
	expire: expire,
	expireat: expireat,
	flushall: flushall,
	flushdb: flushdb,
	geoadd: geoadd,
	geodist: geodist,
	geohash: geohash,
	geopos: geopos,
	georadius: georadius,
	georadius_ro: georadius_ro,
	georadiusbymember: georadiusbymember,
	georadiusbymember_ro: georadiusbymember_ro,
	get: get,
	getbit: getbit,
	getrange: getrange,
	getset: getset,
	hdel: hdel,
	hello: hello,
	hexists: hexists,
	hget: hget,
	hgetall: hgetall,
	hincrby: hincrby,
	hincrbyfloat: hincrbyfloat,
	hkeys: hkeys,
	hlen: hlen,
	hmget: hmget,
	hmset: hmset,
	hscan: hscan,
	hset: hset,
	hsetnx: hsetnx,
	hstrlen: hstrlen,
	hvals: hvals,
	incr: incr,
	incrby: incrby,
	incrbyfloat: incrbyfloat,
	info: info,
	keys: keys,
	lastsave: lastsave,
	latency: latency,
	lindex: lindex,
	linsert: linsert,
	llen: llen,
	lolwut: lolwut,
	lpop: lpop,
	lpos: lpos,
	lpush: lpush,
	lpushx: lpushx,
	lrange: lrange,
	lrem: lrem,
	lset: lset,
	ltrim: ltrim,
	memory: memory,
	mget: mget,
	migrate: migrate,
	module: module,
	monitor: monitor,
	move: move,
	mset: mset,
	msetnx: msetnx,
	multi: multi,
	object: object,
	persist: persist,
	pexpire: pexpire,
	pexpireat: pexpireat,
	pfadd: pfadd,
	pfcount: pfcount,
	pfdebug: pfdebug,
	pfmerge: pfmerge,
	pfselftest: pfselftest,
	ping: ping,
	post: post,
	psetex: psetex,
	psubscribe: psubscribe,
	psync: psync,
	pttl: pttl,
	publish: publish,
	pubsub: pubsub,
	punsubscribe: punsubscribe,
	quit: quit,
	randomkey: randomkey,
	readonly: readonly,
	readwrite: readwrite,
	rename: rename,
	renamenx: renamenx,
	replconf: replconf,
	replicaof: replicaof,
	restore: restore,
	role: role,
	rpop: rpop,
	rpoplpush: rpoplpush,
	rpush: rpush,
	rpushx: rpushx,
	sadd: sadd,
	save: save,
	scan: scan,
	scard: scard,
	script: script,
	sdiff: sdiff,
	sdiffstore: sdiffstore,
	select: select,
	set: set,
	setbit: setbit,
	setex: setex,
	setnx: setnx,
	setrange: setrange,
	shutdown: shutdown,
	sinter: sinter,
	sinterstore: sinterstore,
	sismember: sismember,
	slaveof: slaveof,
	slowlog: slowlog,
	smembers: smembers,
	smove: smove,
	sort: sort,
	spop: spop,
	srandmember: srandmember,
	srem: srem,
	sscan: sscan,
	stralgo: stralgo,
	strlen: strlen,
	subscribe: subscribe,
	substr: substr,
	sunion: sunion,
	sunionstore: sunionstore,
	swapdb: swapdb,
	sync: sync,
	time: time,
	touch: touch,
	ttl: ttl,
	type: type,
	unlink: unlink,
	unsubscribe: unsubscribe,
	unwatch: unwatch,
	wait: wait,
	watch: watch,
	xack: xack,
	xadd: xadd,
	xclaim: xclaim,
	xdel: xdel,
	xgroup: xgroup,
	xinfo: xinfo,
	xlen: xlen,
	xpending: xpending,
	xrange: xrange,
	xread: xread,
	xreadgroup: xreadgroup,
	xrevrange: xrevrange,
	xsetid: xsetid,
	xtrim: xtrim,
	zadd: zadd,
	zcard: zcard,
	zcount: zcount,
	zincrby: zincrby,
	zinterstore: zinterstore,
	zlexcount: zlexcount,
	zpopmax: zpopmax,
	zpopmin: zpopmin,
	zrange: zrange,
	zrangebylex: zrangebylex,
	zrangebyscore: zrangebyscore,
	zrank: zrank,
	zrem: zrem,
	zremrangebylex: zremrangebylex,
	zremrangebyrank: zremrangebyrank,
	zremrangebyscore: zremrangebyscore,
	zrevrange: zrevrange,
	zrevrangebylex: zrevrangebylex,
	zrevrangebyscore: zrevrangebyscore,
	zrevrank: zrevrank,
	zscan: zscan,
	zscore: zscore,
	zunionstore: zunionstore,
	'default': commands
});

var commands$2 = getCjsExportFromNamespace(commands$1);

var redisCommands = createCommonjsModule(function (module, exports) {



/**
 * Redis command list
 *
 * All commands are lowercased.
 *
 * @var {string[]}
 * @public
 */
exports.list = Object.keys(commands$2);

var flags = {};
exports.list.forEach(function (commandName) {
  flags[commandName] = commands$2[commandName].flags.reduce(function (flags, flag) {
    flags[flag] = true;
    return flags
  }, {});
});
/**
 * Check if the command exists
 *
 * @param {string} commandName - the command name
 * @return {boolean} result
 * @public
 */
exports.exists = function (commandName) {
  return Boolean(commands$2[commandName])
};

/**
 * Check if the command has the flag
 *
 * Some of possible flags: readonly, noscript, loading
 * @param {string} commandName - the command name
 * @param {string} flag - the flag to check
 * @return {boolean} result
 * @public
 */
exports.hasFlag = function (commandName, flag) {
  if (!flags[commandName]) {
    throw new Error('Unknown command ' + commandName)
  }

  return Boolean(flags[commandName][flag])
};

/**
 * Get indexes of keys in the command arguments
 *
 * @param {string} commandName - the command name
 * @param {string[]} args - the arguments of the command
 * @param {object} [options] - options
 * @param {boolean} [options.parseExternalKey] - parse external keys
 * @return {number[]} - the list of the index
 * @public
 *
 * @example
 * ```javascript
 * getKeyIndexes('set', ['key', 'value']) // [0]
 * getKeyIndexes('mget', ['key1', 'key2']) // [0, 1]
 * ```
 */
exports.getKeyIndexes = function (commandName, args, options) {
  var command = commands$2[commandName];
  if (!command) {
    throw new Error('Unknown command ' + commandName)
  }

  if (!Array.isArray(args)) {
    throw new Error('Expect args to be an array')
  }

  var keys = [];
  var i, keyStart, keyStop, parseExternalKey;
  switch (commandName) {
    case 'zunionstore':
    case 'zinterstore':
      keys.push(0);
    // fall through
    case 'eval':
    case 'evalsha':
      keyStop = Number(args[1]) + 2;
      for (i = 2; i < keyStop; i++) {
        keys.push(i);
      }
      break
    case 'sort':
      parseExternalKey = options && options.parseExternalKey;
      keys.push(0);
      for (i = 1; i < args.length - 1; i++) {
        if (typeof args[i] !== 'string') {
          continue
        }
        var directive = args[i].toUpperCase();
        if (directive === 'GET') {
          i += 1;
          if (args[i] !== '#') {
            if (parseExternalKey) {
              keys.push([i, getExternalKeyNameLength(args[i])]);
            } else {
              keys.push(i);
            }
          }
        } else if (directive === 'BY') {
          i += 1;
          if (parseExternalKey) {
            keys.push([i, getExternalKeyNameLength(args[i])]);
          } else {
            keys.push(i);
          }
        } else if (directive === 'STORE') {
          i += 1;
          keys.push(i);
        }
      }
      break
    case 'migrate':
      if (args[2] === '') {
        for (i = 5; i < args.length - 1; i++) {
          if (args[i].toUpperCase() === 'KEYS') {
            for (var j = i + 1; j < args.length; j++) {
              keys.push(j);
            }
            break
          }
        }
      } else {
        keys.push(2);
      }
      break
    case 'xreadgroup':
    case 'xread':
      // Keys are 1st half of the args after STREAMS argument.
      for (i = commandName === 'xread' ? 0 : 3; i < args.length - 1; i++) {
        if (String(args[i]).toUpperCase() === 'STREAMS') {
          for (j = i + 1; j <= i + ((args.length - 1 - i) / 2); j++) {
            keys.push(j);
          }
          break
        }
      }
      break
    default:
      // Step has to be at least one in this case, otherwise the command does
      // not contain a key.
      if (command.step > 0) {
        keyStart = command.keyStart - 1;
        keyStop = command.keyStop > 0 ? command.keyStop : args.length + command.keyStop + 1;
        for (i = keyStart; i < keyStop; i += command.step) {
          keys.push(i);
        }
      }
      break
  }

  return keys
};

function getExternalKeyNameLength (key) {
  if (typeof key !== 'string') {
    key = String(key);
  }
  var hashPos = key.indexOf('->');
  return hashPos === -1 ? key.length : hashPos
}
});
