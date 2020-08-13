import os from 'os';
import util from 'util';
import events from 'events';
import buffer from 'buffer';
import 'dgram';

var r = /[A-Z]/g;

var dnsEqual = function (a, b) {
  a = a.replace(r, replacer);
  b = b.replace(r, replacer);
  return a === b
};

function replacer (m) {
  return m.toLowerCase()
}

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

var multicastDnsServiceTypes = createCommonjsModule(function (module, exports) {
var prefix = function (name) {
  return '_' + name
};

var defined = function (name) {
  return name
};

exports.stringify = function (data) {
  if (typeof data === 'object' && data && data.name) return exports.stringify(data.name, data.protocol, data.subtypes)
  return Array.prototype.concat.apply([], arguments).filter(defined).map(prefix).join('.')
};

exports.parse = function (str) {
  var parts = str.split('.');

  for (var i = 0; i < parts.length; i++) {
    if (parts[i][0] !== '_') continue
    parts[i] = parts[i].slice(1);
  }

  return {
    name: parts.shift(),
    protocol: parts.shift() || null,
    subtypes: parts
  }
};

exports.tcp = function (name) {
  return exports.stringify(name, 'tcp', Array.prototype.concat.apply([], Array.prototype.slice.call(arguments, 1)))
};

exports.udp = function (name) {
  return exports.stringify(name, 'udp', Array.prototype.concat.apply([], Array.prototype.slice.call(arguments, 1)))
};
});

var bufferIndexof = function bufferIndexOf(buff, search, offset, encoding){
  if (!Buffer.isBuffer(buff)) {
    throw TypeError('buffer is not a buffer');
  }

  // allow optional offset when providing an encoding
  if (encoding === undefined && typeof offset === 'string') {
    encoding = offset;
    offset = undefined;
  }

  if (typeof search === 'string') {
    search = new Buffer(search, encoding || 'utf8');
  } else if (typeof search === 'number' && !isNaN(search)) {
    search = new Buffer([search]);
  } else if (!Buffer.isBuffer(search)) {
    throw TypeError('search is not a bufferable object');
  }

  if (search.length === 0) {
    return -1;
  }

  if (offset === undefined || (typeof offset === 'number' && isNaN(offset))) {
    offset = 0;
  } else if (typeof offset !== 'number') {
    throw TypeError('offset is not a number');
  }

  if (offset < 0) {
    offset = buff.length + offset;
  }

  if (offset < 0) {
    offset = 0;
  }

  var m = 0;
  var s = -1;

  for (var i = offset; i < buff.length ; ++i) {
    if(buff[i] != search[m]){
      s = -1;
      // <-- go back
      // match abc to aabc
      // 'aabc'
      // 'aab'
      //    ^ no match
      // a'abc'
      //   ^ set index here now and look at these again.
      //   'abc' yay!
      i -= m-1;
      m = 0;
    }

    if(buff[i] == search[m]) {
      if(s == -1) {
        s = i;
      }
      ++m;
      if(m == search.length) {
        break;
      }
    }
  }

  if (s > -1 && buff.length - s < search.length) {
    return -1;
  }
  return s;
};

var equalSign = new Buffer('=');

var dnsTxt = function (opts) {
  var binary = opts ? opts.binary : false;
  var that = {};

  that.encode = function (data, buf, offset) {
    if (!data) data = {};
    if (!offset) offset = 0;
    if (!buf) buf = new Buffer(that.encodingLength(data) + offset);

    var oldOffset = offset;
    var keys = Object.keys(data);

    if (keys.length === 0) {
      buf[offset] = 0;
      offset++;
    }

    keys.forEach(function (key) {
      var val = data[key];
      var oldOffset = offset;
      offset++;

      if (val === true) {
        offset += buf.write(key, offset);
      } else if (Buffer.isBuffer(val)) {
        offset += buf.write(key + '=', offset);
        var len = val.length;
        val.copy(buf, offset, 0, len);
        offset += len;
      } else {
        offset += buf.write(key + '=' + val, offset);
      }

      buf[oldOffset] = offset - oldOffset - 1;
    });

    that.encode.bytes = offset - oldOffset;
    return buf
  };

  that.decode = function (buf, offset, len) {
    if (!offset) offset = 0;
    if (!Number.isFinite(len)) len = buf.length;
    var data = {};
    var oldOffset = offset;

    while (offset < len) {
      var b = decodeBlock(buf, offset);
      var i = bufferIndexof(b, equalSign);
      offset += decodeBlock.bytes;

      if (b.length === 0) continue // ignore: most likely a single zero byte
      if (i === -1) data[b.toString().toLowerCase()] = true;
      else if (i === 0) continue // ignore: invalid key-length
      else {
        var key = b.slice(0, i).toString().toLowerCase();
        if (key in data) continue // ignore: overwriting not allowed
        data[key] = binary ? b.slice(i + 1) : b.slice(i + 1).toString();
      }
    }

    that.decode.bytes = offset - oldOffset;
    return data
  };

  that.encodingLength = function (data) {
    if (!data) return 1 // 1 byte (single empty byte)
    var keys = Object.keys(data);
    if (keys.length === 0) return 1 // 1 byte (single empty byte)
    return keys.reduce(function (total, key) {
      var val = data[key];
      total += Buffer.byteLength(key) + 1; // +1 byte to store field length
      if (Buffer.isBuffer(val)) total += val.length + 1; // +1 byte to fit equal sign
      else if (val !== true) total += Buffer.byteLength(String(val)) + 1; // +1 byte to fit equal sign
      return total
    }, 0)
  };

  return that
};

function decodeBlock (buf, offset) {
  var len = buf[offset];
  var to = offset + 1 + len;
  var b = buf.slice(offset + 1, to > buf.length ? buf.length : to);
  decodeBlock.bytes = len + 1;
  return b
}

var EventEmitter = events.EventEmitter;

var txt = dnsTxt();

var TLD = '.local';

util.inherits(Service, EventEmitter);

function Service (opts) {
  if (!opts.name) throw new Error('Required name not given')
  if (!opts.type) throw new Error('Required type not given')
  if (!opts.port) throw new Error('Required port not given')

  this.name = opts.name;
  this.protocol = opts.protocol || 'tcp';
  this.type = multicastDnsServiceTypes.stringify(opts.type, this.protocol);
  this.host = opts.host || os.hostname();
  this.port = opts.port;
  this.fqdn = this.name + '.' + this.type + TLD;
  this.subtypes = opts.subtypes || null;
  this.txt = opts.txt || null;
  this.published = false;

  this._activated = false; // indicates intent - true: starting/started, false: stopping/stopped
}

Service.prototype._records = function () {
  var records = [rr_ptr(this), rr_srv(this), rr_txt(this)];

  var self = this;
  var interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach(function (name) {
    interfaces[name].forEach(function (addr) {
      if (addr.internal) return
      if (addr.family === 'IPv4') {
        records.push(rr_a(self, addr.address));
      } else {
        records.push(rr_aaaa(self, addr.address));
      }
    });
  });

  return records
};

function rr_ptr (service) {
  return {
    name: service.type + TLD,
    type: 'PTR',
    ttl: 28800,
    data: service.fqdn
  }
}

function rr_srv (service) {
  return {
    name: service.fqdn,
    type: 'SRV',
    ttl: 120,
    data: {
      port: service.port,
      target: service.host
    }
  }
}

function rr_txt (service) {
  return {
    name: service.fqdn,
    type: 'TXT',
    ttl: 4500,
    data: txt.encode(service.txt)
  }
}

function rr_a (service, ip) {
  return {
    name: service.host,
    type: 'A',
    ttl: 120,
    data: ip
  }
}

function rr_aaaa (service, ip) {
  return {
    name: service.host,
    type: 'AAAA',
    ttl: 120,
    data: ip
  }
}

var toString_1 = function (type) {
  switch (type) {
    case 1: return 'A'
    case 10: return 'NULL'
    case 28: return 'AAAA'
    case 18: return 'AFSDB'
    case 42: return 'APL'
    case 257: return 'CAA'
    case 60: return 'CDNSKEY'
    case 59: return 'CDS'
    case 37: return 'CERT'
    case 5: return 'CNAME'
    case 49: return 'DHCID'
    case 32769: return 'DLV'
    case 39: return 'DNAME'
    case 48: return 'DNSKEY'
    case 43: return 'DS'
    case 55: return 'HIP'
    case 13: return 'HINFO'
    case 45: return 'IPSECKEY'
    case 25: return 'KEY'
    case 36: return 'KX'
    case 29: return 'LOC'
    case 15: return 'MX'
    case 35: return 'NAPTR'
    case 2: return 'NS'
    case 47: return 'NSEC'
    case 50: return 'NSEC3'
    case 51: return 'NSEC3PARAM'
    case 12: return 'PTR'
    case 46: return 'RRSIG'
    case 17: return 'RP'
    case 24: return 'SIG'
    case 6: return 'SOA'
    case 99: return 'SPF'
    case 33: return 'SRV'
    case 44: return 'SSHFP'
    case 32768: return 'TA'
    case 249: return 'TKEY'
    case 52: return 'TLSA'
    case 250: return 'TSIG'
    case 16: return 'TXT'
    case 252: return 'AXFR'
    case 251: return 'IXFR'
    case 41: return 'OPT'
    case 255: return 'ANY'
  }
  return 'UNKNOWN_' + type
};

var toType = function (name) {
  switch (name.toUpperCase()) {
    case 'A': return 1
    case 'NULL': return 10
    case 'AAAA': return 28
    case 'AFSDB': return 18
    case 'APL': return 42
    case 'CAA': return 257
    case 'CDNSKEY': return 60
    case 'CDS': return 59
    case 'CERT': return 37
    case 'CNAME': return 5
    case 'DHCID': return 49
    case 'DLV': return 32769
    case 'DNAME': return 39
    case 'DNSKEY': return 48
    case 'DS': return 43
    case 'HIP': return 55
    case 'HINFO': return 13
    case 'IPSECKEY': return 45
    case 'KEY': return 25
    case 'KX': return 36
    case 'LOC': return 29
    case 'MX': return 15
    case 'NAPTR': return 35
    case 'NS': return 2
    case 'NSEC': return 47
    case 'NSEC3': return 50
    case 'NSEC3PARAM': return 51
    case 'PTR': return 12
    case 'RRSIG': return 46
    case 'RP': return 17
    case 'SIG': return 24
    case 'SOA': return 6
    case 'SPF': return 99
    case 'SRV': return 33
    case 'SSHFP': return 44
    case 'TA': return 32768
    case 'TKEY': return 249
    case 'TLSA': return 52
    case 'TSIG': return 250
    case 'TXT': return 16
    case 'AXFR': return 252
    case 'IXFR': return 251
    case 'OPT': return 41
    case 'ANY': return 255
    case '*': return 255
  }
  return 0
};

var types = {
	toString: toString_1,
	toType: toType
};

/*
 * Traditional DNS header RCODEs (4-bits) defined by IANA in
 * https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml
 */

var toString_1$1 = function (rcode) {
  switch (rcode) {
    case 0: return 'NOERROR'
    case 1: return 'FORMERR'
    case 2: return 'SERVFAIL'
    case 3: return 'NXDOMAIN'
    case 4: return 'NOTIMP'
    case 5: return 'REFUSED'
    case 6: return 'YXDOMAIN'
    case 7: return 'YXRRSET'
    case 8: return 'NXRRSET'
    case 9: return 'NOTAUTH'
    case 10: return 'NOTZONE'
    case 11: return 'RCODE_11'
    case 12: return 'RCODE_12'
    case 13: return 'RCODE_13'
    case 14: return 'RCODE_14'
    case 15: return 'RCODE_15'
  }
  return 'RCODE_' + rcode
};

var toRcode = function (code) {
  switch (code.toUpperCase()) {
    case 'NOERROR': return 0
    case 'FORMERR': return 1
    case 'SERVFAIL': return 2
    case 'NXDOMAIN': return 3
    case 'NOTIMP': return 4
    case 'REFUSED': return 5
    case 'YXDOMAIN': return 6
    case 'YXRRSET': return 7
    case 'NXRRSET': return 8
    case 'NOTAUTH': return 9
    case 'NOTZONE': return 10
    case 'RCODE_11': return 11
    case 'RCODE_12': return 12
    case 'RCODE_13': return 13
    case 'RCODE_14': return 14
    case 'RCODE_15': return 15
  }
  return 0
};

var rcodes = {
	toString: toString_1$1,
	toRcode: toRcode
};

/*
 * Traditional DNS header OPCODEs (4-bits) defined by IANA in
 * https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-5
 */

var toString_1$2 = function (opcode) {
  switch (opcode) {
    case 0: return 'QUERY'
    case 1: return 'IQUERY'
    case 2: return 'STATUS'
    case 3: return 'OPCODE_3'
    case 4: return 'NOTIFY'
    case 5: return 'UPDATE'
    case 6: return 'OPCODE_6'
    case 7: return 'OPCODE_7'
    case 8: return 'OPCODE_8'
    case 9: return 'OPCODE_9'
    case 10: return 'OPCODE_10'
    case 11: return 'OPCODE_11'
    case 12: return 'OPCODE_12'
    case 13: return 'OPCODE_13'
    case 14: return 'OPCODE_14'
    case 15: return 'OPCODE_15'
  }
  return 'OPCODE_' + opcode
};

var toOpcode = function (code) {
  switch (code.toUpperCase()) {
    case 'QUERY': return 0
    case 'IQUERY': return 1
    case 'STATUS': return 2
    case 'OPCODE_3': return 3
    case 'NOTIFY': return 4
    case 'UPDATE': return 5
    case 'OPCODE_6': return 6
    case 'OPCODE_7': return 7
    case 'OPCODE_8': return 8
    case 'OPCODE_9': return 9
    case 'OPCODE_10': return 10
    case 'OPCODE_11': return 11
    case 'OPCODE_12': return 12
    case 'OPCODE_13': return 13
    case 'OPCODE_14': return 14
    case 'OPCODE_15': return 15
  }
  return 0
};

var opcodes = {
	toString: toString_1$2,
	toOpcode: toOpcode
};

var ip_1 = createCommonjsModule(function (module, exports) {

var ip = exports;
var Buffer = buffer.Buffer;


ip.toBuffer = function(ip, buff, offset) {
  offset = ~~offset;

  var result;

  if (this.isV4Format(ip)) {
    result = buff || new Buffer(offset + 4);
    ip.split(/\./g).map(function(byte) {
      result[offset++] = parseInt(byte, 10) & 0xff;
    });
  } else if (this.isV6Format(ip)) {
    var sections = ip.split(':', 8);

    var i;
    for (i = 0; i < sections.length; i++) {
      var isv4 = this.isV4Format(sections[i]);
      var v4Buffer;

      if (isv4) {
        v4Buffer = this.toBuffer(sections[i]);
        sections[i] = v4Buffer.slice(0, 2).toString('hex');
      }

      if (v4Buffer && ++i < 8) {
        sections.splice(i, 0, v4Buffer.slice(2, 4).toString('hex'));
      }
    }

    if (sections[0] === '') {
      while (sections.length < 8) sections.unshift('0');
    } else if (sections[sections.length - 1] === '') {
      while (sections.length < 8) sections.push('0');
    } else if (sections.length < 8) {
      for (i = 0; i < sections.length && sections[i] !== ''; i++);
      var argv = [ i, 1 ];
      for (i = 9 - sections.length; i > 0; i--) {
        argv.push('0');
      }
      sections.splice.apply(sections, argv);
    }

    result = buff || new Buffer(offset + 16);
    for (i = 0; i < sections.length; i++) {
      var word = parseInt(sections[i], 16);
      result[offset++] = (word >> 8) & 0xff;
      result[offset++] = word & 0xff;
    }
  }

  if (!result) {
    throw Error('Invalid ip address: ' + ip);
  }

  return result;
};

ip.toString = function(buff, offset, length) {
  offset = ~~offset;
  length = length || (buff.length - offset);

  var result = [];
  if (length === 4) {
    // IPv4
    for (var i = 0; i < length; i++) {
      result.push(buff[offset + i]);
    }
    result = result.join('.');
  } else if (length === 16) {
    // IPv6
    for (var i = 0; i < length; i += 2) {
      result.push(buff.readUInt16BE(offset + i).toString(16));
    }
    result = result.join(':');
    result = result.replace(/(^|:)0(:0)*:0(:|$)/, '$1::$3');
    result = result.replace(/:{3,4}/, '::');
  }

  return result;
};

var ipv4Regex = /^(\d{1,3}\.){3,3}\d{1,3}$/;
var ipv6Regex =
    /^(::)?(((\d{1,3}\.){3}(\d{1,3}){1})?([0-9a-f]){0,4}:{0,2}){1,8}(::)?$/i;

ip.isV4Format = function(ip) {
  return ipv4Regex.test(ip);
};

ip.isV6Format = function(ip) {
  return ipv6Regex.test(ip);
};
function _normalizeFamily(family) {
  return family ? family.toLowerCase() : 'ipv4';
}

ip.fromPrefixLen = function(prefixlen, family) {
  if (prefixlen > 32) {
    family = 'ipv6';
  } else {
    family = _normalizeFamily(family);
  }

  var len = 4;
  if (family === 'ipv6') {
    len = 16;
  }
  var buff = new Buffer(len);

  for (var i = 0, n = buff.length; i < n; ++i) {
    var bits = 8;
    if (prefixlen < 8) {
      bits = prefixlen;
    }
    prefixlen -= bits;

    buff[i] = ~(0xff >> bits) & 0xff;
  }

  return ip.toString(buff);
};

ip.mask = function(addr, mask) {
  addr = ip.toBuffer(addr);
  mask = ip.toBuffer(mask);

  var result = new Buffer(Math.max(addr.length, mask.length));

  var i = 0;
  // Same protocol - do bitwise and
  if (addr.length === mask.length) {
    for (i = 0; i < addr.length; i++) {
      result[i] = addr[i] & mask[i];
    }
  } else if (mask.length === 4) {
    // IPv6 address and IPv4 mask
    // (Mask low bits)
    for (i = 0; i < mask.length; i++) {
      result[i] = addr[addr.length - 4  + i] & mask[i];
    }
  } else {
    // IPv6 mask and IPv4 addr
    for (var i = 0; i < result.length - 6; i++) {
      result[i] = 0;
    }

    // ::ffff:ipv4
    result[10] = 0xff;
    result[11] = 0xff;
    for (i = 0; i < addr.length; i++) {
      result[i + 12] = addr[i] & mask[i + 12];
    }
    i = i + 12;
  }
  for (; i < result.length; i++)
    result[i] = 0;

  return ip.toString(result);
};

ip.cidr = function(cidrString) {
  var cidrParts = cidrString.split('/');

  var addr = cidrParts[0];
  if (cidrParts.length !== 2)
    throw new Error('invalid CIDR subnet: ' + addr);

  var mask = ip.fromPrefixLen(parseInt(cidrParts[1], 10));

  return ip.mask(addr, mask);
};

ip.subnet = function(addr, mask) {
  var networkAddress = ip.toLong(ip.mask(addr, mask));

  // Calculate the mask's length.
  var maskBuffer = ip.toBuffer(mask);
  var maskLength = 0;

  for (var i = 0; i < maskBuffer.length; i++) {
    if (maskBuffer[i] === 0xff) {
      maskLength += 8;
    } else {
      var octet = maskBuffer[i] & 0xff;
      while (octet) {
        octet = (octet << 1) & 0xff;
        maskLength++;
      }
    }
  }

  var numberOfAddresses = Math.pow(2, 32 - maskLength);

  return {
    networkAddress: ip.fromLong(networkAddress),
    firstAddress: numberOfAddresses <= 2 ?
                    ip.fromLong(networkAddress) :
                    ip.fromLong(networkAddress + 1),
    lastAddress: numberOfAddresses <= 2 ?
                    ip.fromLong(networkAddress + numberOfAddresses - 1) :
                    ip.fromLong(networkAddress + numberOfAddresses - 2),
    broadcastAddress: ip.fromLong(networkAddress + numberOfAddresses - 1),
    subnetMask: mask,
    subnetMaskLength: maskLength,
    numHosts: numberOfAddresses <= 2 ?
                numberOfAddresses : numberOfAddresses - 2,
    length: numberOfAddresses,
    contains: function(other) {
      return networkAddress === ip.toLong(ip.mask(other, mask));
    }
  };
};

ip.cidrSubnet = function(cidrString) {
  var cidrParts = cidrString.split('/');

  var addr = cidrParts[0];
  if (cidrParts.length !== 2)
    throw new Error('invalid CIDR subnet: ' + addr);

  var mask = ip.fromPrefixLen(parseInt(cidrParts[1], 10));

  return ip.subnet(addr, mask);
};

ip.not = function(addr) {
  var buff = ip.toBuffer(addr);
  for (var i = 0; i < buff.length; i++) {
    buff[i] = 0xff ^ buff[i];
  }
  return ip.toString(buff);
};

ip.or = function(a, b) {
  a = ip.toBuffer(a);
  b = ip.toBuffer(b);

  // same protocol
  if (a.length === b.length) {
    for (var i = 0; i < a.length; ++i) {
      a[i] |= b[i];
    }
    return ip.toString(a);

  // mixed protocols
  } else {
    var buff = a;
    var other = b;
    if (b.length > a.length) {
      buff = b;
      other = a;
    }

    var offset = buff.length - other.length;
    for (var i = offset; i < buff.length; ++i) {
      buff[i] |= other[i - offset];
    }

    return ip.toString(buff);
  }
};

ip.isEqual = function(a, b) {
  a = ip.toBuffer(a);
  b = ip.toBuffer(b);

  // Same protocol
  if (a.length === b.length) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  // Swap
  if (b.length === 4) {
    var t = b;
    b = a;
    a = t;
  }

  // a - IPv4, b - IPv6
  for (var i = 0; i < 10; i++) {
    if (b[i] !== 0) return false;
  }

  var word = b.readUInt16BE(10);
  if (word !== 0 && word !== 0xffff) return false;

  for (var i = 0; i < 4; i++) {
    if (a[i] !== b[i + 12]) return false;
  }

  return true;
};

ip.isPrivate = function(addr) {
  return /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i
      .test(addr) ||
    /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
    /^(::f{4}:)?172\.(1[6-9]|2\d|30|31)\.([0-9]{1,3})\.([0-9]{1,3})$/i
      .test(addr) ||
    /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
    /^(::f{4}:)?169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
    /^f[cd][0-9a-f]{2}:/i.test(addr) ||
    /^fe80:/i.test(addr) ||
    /^::1$/.test(addr) ||
    /^::$/.test(addr);
};

ip.isPublic = function(addr) {
  return !ip.isPrivate(addr);
};

ip.isLoopback = function(addr) {
  return /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/
      .test(addr) ||
    /^fe80::1$/.test(addr) ||
    /^::1$/.test(addr) ||
    /^::$/.test(addr);
};

ip.loopback = function(family) {
  //
  // Default to `ipv4`
  //
  family = _normalizeFamily(family);

  if (family !== 'ipv4' && family !== 'ipv6') {
    throw new Error('family must be ipv4 or ipv6');
  }

  return family === 'ipv4' ? '127.0.0.1' : 'fe80::1';
};

//
// ### function address (name, family)
// #### @name {string|'public'|'private'} **Optional** Name or security
//      of the network interface.
// #### @family {ipv4|ipv6} **Optional** IP family of the address (defaults
//      to ipv4).
//
// Returns the address for the network interface on the current system with
// the specified `name`:
//   * String: First `family` address of the interface.
//             If not found see `undefined`.
//   * 'public': the first public ip address of family.
//   * 'private': the first private ip address of family.
//   * undefined: First address with `ipv4` or loopback address `127.0.0.1`.
//
ip.address = function(name, family) {
  var interfaces = os.networkInterfaces();
  var all;

  //
  // Default to `ipv4`
  //
  family = _normalizeFamily(family);

  //
  // If a specific network interface has been named,
  // return the address.
  //
  if (name && name !== 'private' && name !== 'public') {
    var res = interfaces[name].filter(function(details) {
      var itemFamily = details.family.toLowerCase();
      return itemFamily === family;
    });
    if (res.length === 0)
      return undefined;
    return res[0].address;
  }

  var all = Object.keys(interfaces).map(function (nic) {
    //
    // Note: name will only be `public` or `private`
    // when this is called.
    //
    var addresses = interfaces[nic].filter(function (details) {
      details.family = details.family.toLowerCase();
      if (details.family !== family || ip.isLoopback(details.address)) {
        return false;
      } else if (!name) {
        return true;
      }

      return name === 'public' ? ip.isPrivate(details.address) :
          ip.isPublic(details.address);
    });

    return addresses.length ? addresses[0].address : undefined;
  }).filter(Boolean);

  return !all.length ? ip.loopback(family) : all[0];
};

ip.toLong = function(ip) {
  var ipl = 0;
  ip.split('.').forEach(function(octet) {
    ipl <<= 8;
    ipl += parseInt(octet);
  });
  return(ipl >>> 0);
};

ip.fromLong = function(ipl) {
  return ((ipl >>> 24) + '.' +
      (ipl >> 16 & 255) + '.' +
      (ipl >> 8 & 255) + '.' +
      (ipl & 255) );
};
});

var safeBuffer = createCommonjsModule(function (module, exports) {
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */

var Buffer = buffer.Buffer;

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key];
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer;
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports);
  exports.Buffer = SafeBuffer;
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.prototype = Object.create(Buffer.prototype);

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer);

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
};

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size);
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding);
    } else {
      buf.fill(fill);
    }
  } else {
    buf.fill(0);
  }
  return buf
};

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
};

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
};
});

var dnsPacket = createCommonjsModule(function (module, exports) {
var Buffer = safeBuffer.Buffer;

var QUERY_FLAG = 0;
var RESPONSE_FLAG = 1 << 15;
var FLUSH_MASK = 1 << 15;
var NOT_FLUSH_MASK = ~FLUSH_MASK;
var QU_MASK = 1 << 15;
var NOT_QU_MASK = ~QU_MASK;

var name = exports.txt = exports.name = {};

name.encode = function (str, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(name.encodingLength(str));
  if (!offset) offset = 0;
  var oldOffset = offset;

  // strip leading and trailing .
  var n = str.replace(/^\.|\.$/gm, '');
  if (n.length) {
    var list = n.split('.');

    for (var i = 0; i < list.length; i++) {
      var len = buf.write(list[i], offset + 1);
      buf[offset] = len;
      offset += len + 1;
    }
  }

  buf[offset++] = 0;

  name.encode.bytes = offset - oldOffset;
  return buf
};

name.encode.bytes = 0;

name.decode = function (buf, offset) {
  if (!offset) offset = 0;

  var list = [];
  var oldOffset = offset;
  var len = buf[offset++];

  if (len === 0) {
    name.decode.bytes = 1;
    return '.'
  }
  if (len >= 0xc0) {
    var res = name.decode(buf, buf.readUInt16BE(offset - 1) - 0xc000);
    name.decode.bytes = 2;
    return res
  }

  while (len) {
    if (len >= 0xc0) {
      list.push(name.decode(buf, buf.readUInt16BE(offset - 1) - 0xc000));
      offset++;
      break
    }

    list.push(buf.toString('utf-8', offset, offset + len));
    offset += len;
    len = buf[offset++];
  }

  name.decode.bytes = offset - oldOffset;
  return list.join('.')
};

name.decode.bytes = 0;

name.encodingLength = function (n) {
  return Buffer.byteLength(n) + 2
};

var string = {};

string.encode = function (s, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(string.encodingLength(s));
  if (!offset) offset = 0;

  var len = buf.write(s, offset + 1);
  buf[offset] = len;
  string.encode.bytes = len + 1;
  return buf
};

string.encode.bytes = 0;

string.decode = function (buf, offset) {
  if (!offset) offset = 0;

  var len = buf[offset];
  var s = buf.toString('utf-8', offset + 1, offset + 1 + len);
  string.decode.bytes = len + 1;
  return s
};

string.decode.bytes = 0;

string.encodingLength = function (s) {
  return Buffer.byteLength(s) + 1
};

var header = {};

header.encode = function (h, buf, offset) {
  if (!buf) buf = header.encodingLength(h);
  if (!offset) offset = 0;

  var flags = (h.flags || 0) & 32767;
  var type = h.type === 'response' ? RESPONSE_FLAG : QUERY_FLAG;

  buf.writeUInt16BE(h.id || 0, offset);
  buf.writeUInt16BE(flags | type, offset + 2);
  buf.writeUInt16BE(h.questions.length, offset + 4);
  buf.writeUInt16BE(h.answers.length, offset + 6);
  buf.writeUInt16BE(h.authorities.length, offset + 8);
  buf.writeUInt16BE(h.additionals.length, offset + 10);

  return buf
};

header.encode.bytes = 12;

header.decode = function (buf, offset) {
  if (!offset) offset = 0;
  if (buf.length < 12) throw new Error('Header must be 12 bytes')
  var flags = buf.readUInt16BE(offset + 2);

  return {
    id: buf.readUInt16BE(offset),
    type: flags & RESPONSE_FLAG ? 'response' : 'query',
    flags: flags & 32767,
    flag_qr: ((flags >> 15) & 0x1) === 1,
    opcode: opcodes.toString((flags >> 11) & 0xf),
    flag_auth: ((flags >> 10) & 0x1) === 1,
    flag_trunc: ((flags >> 9) & 0x1) === 1,
    flag_rd: ((flags >> 8) & 0x1) === 1,
    flag_ra: ((flags >> 7) & 0x1) === 1,
    flag_z: ((flags >> 6) & 0x1) === 1,
    flag_ad: ((flags >> 5) & 0x1) === 1,
    flag_cd: ((flags >> 4) & 0x1) === 1,
    rcode: rcodes.toString(flags & 0xf),
    questions: new Array(buf.readUInt16BE(offset + 4)),
    answers: new Array(buf.readUInt16BE(offset + 6)),
    authorities: new Array(buf.readUInt16BE(offset + 8)),
    additionals: new Array(buf.readUInt16BE(offset + 10))
  }
};

header.decode.bytes = 12;

header.encodingLength = function () {
  return 12
};

var runknown = exports.unknown = {};

runknown.encode = function (data, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(runknown.encodingLength(data));
  if (!offset) offset = 0;

  buf.writeUInt16BE(data.length, offset);
  data.copy(buf, offset + 2);

  runknown.encode.bytes = data.length + 2;
  return buf
};

runknown.encode.bytes = 0;

runknown.decode = function (buf, offset) {
  if (!offset) offset = 0;

  var len = buf.readUInt16BE(offset);
  var data = buf.slice(offset + 2, offset + 2 + len);
  runknown.decode.bytes = len + 2;
  return data
};

runknown.decode.bytes = 0;

runknown.encodingLength = function (data) {
  return data.length + 2
};

var rns = exports.ns = {};

rns.encode = function (data, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(rns.encodingLength(data));
  if (!offset) offset = 0;

  name.encode(data, buf, offset + 2);
  buf.writeUInt16BE(name.encode.bytes, offset);
  rns.encode.bytes = name.encode.bytes + 2;
  return buf
};

rns.encode.bytes = 0;

rns.decode = function (buf, offset) {
  if (!offset) offset = 0;

  var len = buf.readUInt16BE(offset);
  var dd = name.decode(buf, offset + 2);

  rns.decode.bytes = len + 2;
  return dd
};

rns.decode.bytes = 0;

rns.encodingLength = function (data) {
  return name.encodingLength(data) + 2
};

var rsoa = exports.soa = {};

rsoa.encode = function (data, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(rsoa.encodingLength(data));
  if (!offset) offset = 0;

  var oldOffset = offset;
  offset += 2;
  name.encode(data.mname, buf, offset);
  offset += name.encode.bytes;
  name.encode(data.rname, buf, offset);
  offset += name.encode.bytes;
  buf.writeUInt32BE(data.serial || 0, offset);
  offset += 4;
  buf.writeUInt32BE(data.refresh || 0, offset);
  offset += 4;
  buf.writeUInt32BE(data.retry || 0, offset);
  offset += 4;
  buf.writeUInt32BE(data.expire || 0, offset);
  offset += 4;
  buf.writeUInt32BE(data.minimum || 0, offset);
  offset += 4;

  buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
  rsoa.encode.bytes = offset - oldOffset;
  return buf
};

rsoa.encode.bytes = 0;

rsoa.decode = function (buf, offset) {
  if (!offset) offset = 0;

  var oldOffset = offset;

  var data = {};
  offset += 2;
  data.mname = name.decode(buf, offset);
  offset += name.decode.bytes;
  data.rname = name.decode(buf, offset);
  offset += name.decode.bytes;
  data.serial = buf.readUInt32BE(offset);
  offset += 4;
  data.refresh = buf.readUInt32BE(offset);
  offset += 4;
  data.retry = buf.readUInt32BE(offset);
  offset += 4;
  data.expire = buf.readUInt32BE(offset);
  offset += 4;
  data.minimum = buf.readUInt32BE(offset);
  offset += 4;

  rsoa.decode.bytes = offset - oldOffset;
  return data
};

rsoa.decode.bytes = 0;

rsoa.encodingLength = function (data) {
  return 22 + name.encodingLength(data.mname) + name.encodingLength(data.rname)
};

var rtxt = exports.txt = exports.null = {};
var rnull = rtxt;

rtxt.encode = function (data, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(rtxt.encodingLength(data));
  if (!offset) offset = 0;

  if (typeof data === 'string') data = Buffer.from(data);
  if (!data) data = Buffer.allocUnsafe(0);

  var oldOffset = offset;
  offset += 2;

  var len = data.length;
  data.copy(buf, offset, 0, len);
  offset += len;

  buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
  rtxt.encode.bytes = offset - oldOffset;
  return buf
};

rtxt.encode.bytes = 0;

rtxt.decode = function (buf, offset) {
  if (!offset) offset = 0;
  var oldOffset = offset;
  var len = buf.readUInt16BE(offset);

  offset += 2;

  var data = buf.slice(offset, offset + len);
  offset += len;

  rtxt.decode.bytes = offset - oldOffset;
  return data
};

rtxt.decode.bytes = 0;

rtxt.encodingLength = function (data) {
  if (!data) return 2
  return (Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data)) + 2
};

var rhinfo = exports.hinfo = {};

rhinfo.encode = function (data, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(rhinfo.encodingLength(data));
  if (!offset) offset = 0;

  var oldOffset = offset;
  offset += 2;
  string.encode(data.cpu, buf, offset);
  offset += string.encode.bytes;
  string.encode(data.os, buf, offset);
  offset += string.encode.bytes;
  buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
  rhinfo.encode.bytes = offset - oldOffset;
  return buf
};

rhinfo.encode.bytes = 0;

rhinfo.decode = function (buf, offset) {
  if (!offset) offset = 0;

  var oldOffset = offset;

  var data = {};
  offset += 2;
  data.cpu = string.decode(buf, offset);
  offset += string.decode.bytes;
  data.os = string.decode(buf, offset);
  offset += string.decode.bytes;
  rhinfo.decode.bytes = offset - oldOffset;
  return data
};

rhinfo.decode.bytes = 0;

rhinfo.encodingLength = function (data) {
  return string.encodingLength(data.cpu) + string.encodingLength(data.os) + 2
};

var rptr = exports.ptr = {};
var rcname = exports.cname = rptr;
var rdname = exports.dname = rptr;

rptr.encode = function (data, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(rptr.encodingLength(data));
  if (!offset) offset = 0;

  name.encode(data, buf, offset + 2);
  buf.writeUInt16BE(name.encode.bytes, offset);
  rptr.encode.bytes = name.encode.bytes + 2;
  return buf
};

rptr.encode.bytes = 0;

rptr.decode = function (buf, offset) {
  if (!offset) offset = 0;

  var data = name.decode(buf, offset + 2);
  rptr.decode.bytes = name.decode.bytes + 2;
  return data
};

rptr.decode.bytes = 0;

rptr.encodingLength = function (data) {
  return name.encodingLength(data) + 2
};

var rsrv = exports.srv = {};

rsrv.encode = function (data, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(rsrv.encodingLength(data));
  if (!offset) offset = 0;

  buf.writeUInt16BE(data.priority || 0, offset + 2);
  buf.writeUInt16BE(data.weight || 0, offset + 4);
  buf.writeUInt16BE(data.port || 0, offset + 6);
  name.encode(data.target, buf, offset + 8);

  var len = name.encode.bytes + 6;
  buf.writeUInt16BE(len, offset);

  rsrv.encode.bytes = len + 2;
  return buf
};

rsrv.encode.bytes = 0;

rsrv.decode = function (buf, offset) {
  if (!offset) offset = 0;

  var len = buf.readUInt16BE(offset);

  var data = {};
  data.priority = buf.readUInt16BE(offset + 2);
  data.weight = buf.readUInt16BE(offset + 4);
  data.port = buf.readUInt16BE(offset + 6);
  data.target = name.decode(buf, offset + 8);

  rsrv.decode.bytes = len + 2;
  return data
};

rsrv.decode.bytes = 0;

rsrv.encodingLength = function (data) {
  return 8 + name.encodingLength(data.target)
};

var rcaa = exports.caa = {};

rcaa.ISSUER_CRITICAL = 1 << 7;

rcaa.encode = function (data, buf, offset) {
  var len = rcaa.encodingLength(data);

  if (!buf) buf = Buffer.allocUnsafe(rcaa.encodingLength(data));
  if (!offset) offset = 0;

  if (data.issuerCritical) {
    data.flags = rcaa.ISSUER_CRITICAL;
  }

  buf.writeUInt16BE(len - 2, offset);
  offset += 2;
  buf.writeUInt8(data.flags || 0, offset);
  offset += 1;
  string.encode(data.tag, buf, offset);
  offset += string.encode.bytes;
  buf.write(data.value, offset);
  offset += Buffer.byteLength(data.value);

  rcaa.encode.bytes = len;
  return buf
};

rcaa.encode.bytes = 0;

rcaa.decode = function (buf, offset) {
  if (!offset) offset = 0;

  var len = buf.readUInt16BE(offset);
  offset += 2;

  var oldOffset = offset;
  var data = {};
  data.flags = buf.readUInt8(offset);
  offset += 1;
  data.tag = string.decode(buf, offset);
  offset += string.decode.bytes;
  data.value = buf.toString('utf-8', offset, oldOffset + len);

  data.issuerCritical = !!(data.flags & rcaa.ISSUER_CRITICAL);

  rcaa.decode.bytes = len + 2;

  return data
};

rcaa.decode.bytes = 0;

rcaa.encodingLength = function (data) {
  return string.encodingLength(data.tag) + string.encodingLength(data.value) + 2
};

var ra = exports.a = {};

ra.encode = function (host, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(ra.encodingLength(host));
  if (!offset) offset = 0;

  buf.writeUInt16BE(4, offset);
  offset += 2;
  ip_1.toBuffer(host, buf, offset);
  ra.encode.bytes = 6;
  return buf
};

ra.encode.bytes = 0;

ra.decode = function (buf, offset) {
  if (!offset) offset = 0;

  offset += 2;
  var host = ip_1.toString(buf, offset, 4);
  ra.decode.bytes = 6;
  return host
};

ra.decode.bytes = 0;

ra.encodingLength = function () {
  return 6
};

var raaaa = exports.aaaa = {};

raaaa.encode = function (host, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(raaaa.encodingLength(host));
  if (!offset) offset = 0;

  buf.writeUInt16BE(16, offset);
  offset += 2;
  ip_1.toBuffer(host, buf, offset);
  raaaa.encode.bytes = 18;
  return buf
};

raaaa.encode.bytes = 0;

raaaa.decode = function (buf, offset) {
  if (!offset) offset = 0;

  offset += 2;
  var host = ip_1.toString(buf, offset, 16);
  raaaa.decode.bytes = 18;
  return host
};

raaaa.decode.bytes = 0;

raaaa.encodingLength = function () {
  return 18
};

var renc = exports.record = function (type) {
  switch (type.toUpperCase()) {
    case 'A': return ra
    case 'PTR': return rptr
    case 'CNAME': return rcname
    case 'DNAME': return rdname
    case 'TXT': return rtxt
    case 'NULL': return rnull
    case 'AAAA': return raaaa
    case 'SRV': return rsrv
    case 'HINFO': return rhinfo
    case 'CAA': return rcaa
    case 'NS': return rns
    case 'SOA': return rsoa
  }
  return runknown
};

var answer = exports.answer = {};

answer.encode = function (a, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(answer.encodingLength(a));
  if (!offset) offset = 0;

  var oldOffset = offset;

  name.encode(a.name, buf, offset);
  offset += name.encode.bytes;

  buf.writeUInt16BE(types.toType(a.type), offset);

  var klass = a.class === undefined ? 1 : a.class;
  if (a.flush) klass |= FLUSH_MASK; // the 1st bit of the class is the flush bit
  buf.writeUInt16BE(klass, offset + 2);

  buf.writeUInt32BE(a.ttl || 0, offset + 4);

  var enc = renc(a.type);
  enc.encode(a.data, buf, offset + 8);
  offset += 8 + enc.encode.bytes;

  answer.encode.bytes = offset - oldOffset;
  return buf
};

answer.encode.bytes = 0;

answer.decode = function (buf, offset) {
  if (!offset) offset = 0;

  var a = {};
  var oldOffset = offset;

  a.name = name.decode(buf, offset);
  offset += name.decode.bytes;
  a.type = types.toString(buf.readUInt16BE(offset));
  a.class = buf.readUInt16BE(offset + 2);
  a.ttl = buf.readUInt32BE(offset + 4);

  a.flush = !!(a.class & FLUSH_MASK);
  if (a.flush) a.class &= NOT_FLUSH_MASK;

  var enc = renc(a.type);
  a.data = enc.decode(buf, offset + 8);
  offset += 8 + enc.decode.bytes;

  answer.decode.bytes = offset - oldOffset;
  return a
};

answer.decode.bytes = 0;

answer.encodingLength = function (a) {
  return name.encodingLength(a.name) + 8 + renc(a.type).encodingLength(a.data)
};

var question = exports.question = {};

question.encode = function (q, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(question.encodingLength(q));
  if (!offset) offset = 0;

  var oldOffset = offset;

  name.encode(q.name, buf, offset);
  offset += name.encode.bytes;

  buf.writeUInt16BE(types.toType(q.type), offset);
  offset += 2;

  buf.writeUInt16BE(q.class === undefined ? 1 : q.class, offset);
  offset += 2;

  question.encode.bytes = offset - oldOffset;
  return q
};

question.encode.bytes = 0;

question.decode = function (buf, offset) {
  if (!offset) offset = 0;

  var oldOffset = offset;
  var q = {};

  q.name = name.decode(buf, offset);
  offset += name.decode.bytes;

  q.type = types.toString(buf.readUInt16BE(offset));
  offset += 2;

  q.class = buf.readUInt16BE(offset);
  offset += 2;

  var qu = !!(q.class & QU_MASK);
  if (qu) q.class &= NOT_QU_MASK;

  question.decode.bytes = offset - oldOffset;
  return q
};

question.decode.bytes = 0;

question.encodingLength = function (q) {
  return name.encodingLength(q.name) + 4
};

exports.AUTHORITATIVE_ANSWER = 1 << 10;
exports.TRUNCATED_RESPONSE = 1 << 9;
exports.RECURSION_DESIRED = 1 << 8;
exports.RECURSION_AVAILABLE = 1 << 7;
exports.AUTHENTIC_DATA = 1 << 5;
exports.CHECKING_DISABLED = 1 << 4;

exports.encode = function (result, buf, offset) {
  if (!buf) buf = Buffer.allocUnsafe(exports.encodingLength(result));
  if (!offset) offset = 0;

  var oldOffset = offset;

  if (!result.questions) result.questions = [];
  if (!result.answers) result.answers = [];
  if (!result.authorities) result.authorities = [];
  if (!result.additionals) result.additionals = [];

  header.encode(result, buf, offset);
  offset += header.encode.bytes;

  offset = encodeList(result.questions, question, buf, offset);
  offset = encodeList(result.answers, answer, buf, offset);
  offset = encodeList(result.authorities, answer, buf, offset);
  offset = encodeList(result.additionals, answer, buf, offset);

  exports.encode.bytes = offset - oldOffset;

  return buf
};

exports.encode.bytes = 0;

exports.decode = function (buf, offset) {
  if (!offset) offset = 0;

  var oldOffset = offset;
  var result = header.decode(buf, offset);
  offset += header.decode.bytes;

  offset = decodeList(result.questions, question, buf, offset);
  offset = decodeList(result.answers, answer, buf, offset);
  offset = decodeList(result.authorities, answer, buf, offset);
  offset = decodeList(result.additionals, answer, buf, offset);

  exports.decode.bytes = offset - oldOffset;

  return result
};

exports.decode.bytes = 0;

exports.encodingLength = function (result) {
  return header.encodingLength(result) +
    encodingLengthList(result.questions || [], question) +
    encodingLengthList(result.answers || [], answer) +
    encodingLengthList(result.authorities || [], answer) +
    encodingLengthList(result.additionals || [], answer)
};

function encodingLengthList (list, enc) {
  var len = 0;
  for (var i = 0; i < list.length; i++) len += enc.encodingLength(list[i]);
  return len
}

function encodeList (list, enc, buf, offset) {
  for (var i = 0; i < list.length; i++) {
    enc.encode(list[i], buf, offset);
    offset += enc.encode.bytes;
  }
  return offset
}

function decodeList (list, enc, buf, offset) {
  for (var i = 0; i < list.length; i++) {
    list[i] = enc.decode(buf, offset);
    offset += enc.decode.bytes;
  }
  return offset
}
});

var nextTick = nextTickArgs;
process.nextTick(upgrade, 42); // pass 42 and see if upgrade is called with it

function upgrade (val) {
  if (val === 42) nextTick = process.nextTick;
}

function nextTickArgs (fn, a, b) {
  process.nextTick(function () {
    fn(a, b);
  });
}

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

var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var toStr$2 = Object.prototype.toString;

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return toStr$2.call(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		toStr$2.call(value) !== '[object Array]' &&
		toStr$2.call(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

var hasSymbols = typeof Symbol === 'function' && typeof Symbol('foo') === 'symbol';

var toStr$3 = Object.prototype.toString;
var concat = Array.prototype.concat;
var origDefineProperty = Object.defineProperty;

var isFunction = function (fn) {
	return typeof fn === 'function' && toStr$3.call(fn) === '[object Function]';
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
var toStr$4 = Object.prototype.toString;
var funcType = '[object Function]';

var implementation$1 = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr$4.call(target) !== funcType) {
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

var origSymbol = commonjsGlobal.Symbol;


var hasSymbols$1 = function hasNativeSymbols() {
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

var hasSymbols$2 = hasSymbols$1();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto
var generatorFunction =  undefined$1;
var asyncFunction =  undefined$1;
var asyncGenFunction =  undefined$1;

var TypedArray = typeof Uint8Array === 'undefined' ? undefined$1 : getProto(Uint8Array);

var INTRINSICS = {
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
	'%ArrayBufferPrototype%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer.prototype,
	'%ArrayIteratorPrototype%': hasSymbols$2 ? getProto([][Symbol.iterator]()) : undefined$1,
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
	'%IteratorPrototype%': hasSymbols$2 ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
	'%JSONParse%': typeof JSON === 'object' ? JSON.parse : undefined$1,
	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$2 ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
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
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$2 ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
	'%SetPrototype%': typeof Set === 'undefined' ? undefined$1 : Set.prototype,
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
	'%SharedArrayBufferPrototype%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer.prototype,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols$2 ? getProto(''[Symbol.iterator]()) : undefined$1,
	'%StringPrototype%': String.prototype,
	'%Symbol%': hasSymbols$2 ? Symbol : undefined$1,
	'%SymbolPrototype%': hasSymbols$2 ? Symbol.prototype : undefined$1,
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

var numberIsNaN = function (value) {
	return value !== value;
};

var implementation$2 = function is(a, b) {
	if (a === 0 && b === 0) {
		return 1 / a === 1 / b;
	}
	if (a === b) {
		return true;
	}
	if (numberIsNaN(a) && numberIsNaN(b)) {
		return true;
	}
	return false;
};

var polyfill = function getPolyfill() {
	return typeof Object.is === 'function' ? Object.is : implementation$2;
};

var shim = function shimObjectIs() {
	var polyfill$1 = polyfill();
	defineProperties_1(Object, { is: polyfill$1 }, {
		is: function testObjectIs() {
			return Object.is !== polyfill$1;
		}
	});
	return polyfill$1;
};

var polyfill$1 = callBind(polyfill(), Object);

defineProperties_1(polyfill$1, {
	getPolyfill: polyfill,
	implementation: implementation$2,
	shim: shim
});

var hasSymbols$3 = hasSymbols$1();
var hasToStringTag$1 = hasSymbols$3 && typeof Symbol.toStringTag === 'symbol';
var hasOwnProperty;
var regexExec;
var isRegexMarker;
var badStringifier;

if (hasToStringTag$1) {
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

var $Object = Object;
var $TypeError$1 = TypeError;

var implementation$3 = function flags() {
	if (this != null && this !== $Object(this)) {
		throw new $TypeError$1('RegExp.prototype.flags getter called on non-object');
	}
	var result = '';
	if (this.global) {
		result += 'g';
	}
	if (this.ignoreCase) {
		result += 'i';
	}
	if (this.multiline) {
		result += 'm';
	}
	if (this.dotAll) {
		result += 's';
	}
	if (this.unicode) {
		result += 'u';
	}
	if (this.sticky) {
		result += 'y';
	}
	return result;
};

var supportsDescriptors$1 = defineProperties_1.supportsDescriptors;
var $gOPD$1 = Object.getOwnPropertyDescriptor;
var $TypeError$2 = TypeError;

var polyfill$2 = function getPolyfill() {
	if (!supportsDescriptors$1) {
		throw new $TypeError$2('RegExp.prototype.flags requires a true ES5 environment that supports property descriptors');
	}
	if ((/a/mig).flags === 'gim') {
		var descriptor = $gOPD$1(RegExp.prototype, 'flags');
		if (descriptor && typeof descriptor.get === 'function' && typeof (/a/).dotAll === 'boolean') {
			return descriptor.get;
		}
	}
	return implementation$3;
};

var supportsDescriptors$2 = defineProperties_1.supportsDescriptors;

var gOPD = Object.getOwnPropertyDescriptor;
var defineProperty$1 = Object.defineProperty;
var TypeErr = TypeError;
var getProto$1 = Object.getPrototypeOf;
var regex = /a/;

var shim$1 = function shimFlags() {
	if (!supportsDescriptors$2 || !getProto$1) {
		throw new TypeErr('RegExp.prototype.flags requires a true ES5 environment that supports property descriptors');
	}
	var polyfill = polyfill$2();
	var proto = getProto$1(regex);
	var descriptor = gOPD(proto, 'flags');
	if (!descriptor || descriptor.get !== polyfill) {
		defineProperty$1(proto, 'flags', {
			configurable: true,
			enumerable: false,
			get: polyfill
		});
	}
	return polyfill;
};

var flagsBound = callBind(implementation$3);

defineProperties_1(flagsBound, {
	getPolyfill: polyfill$2,
	implementation: implementation$3,
	shim: shim$1
});

var EventEmitter$1 = events.EventEmitter;




var TLD$1 = '.local';
var WILDCARD = '_services._dns-sd._udp' + TLD$1;

util.inherits(Browser, EventEmitter$1);

/**
 * Start a browser
 *
 * The browser listens for services by querying for PTR records of a given
 * type, protocol and domain, e.g. _http._tcp.local.
 *
 * If no type is given, a wild card search is performed.
 *
 * An internal list of online services is kept which starts out empty. When
 * ever a new service is discovered, it's added to the list and an "up" event
 * is emitted with that service. When it's discovered that the service is no
 * longer available, it is removed from the list and a "down" event is emitted
 * with that service.
 */
function Browser (mdns, opts, onup) {
  if (typeof opts === 'function') return new Browser(mdns, null, opts)

  EventEmitter$1.call(this);

  this._mdns = mdns;
  this._onresponse = null;
  this._serviceMap = {};
  this._txt = dnsTxt(opts.txt);

  if (!opts || !opts.type) {
    this._name = WILDCARD;
    this._wildcard = true;
  } else {
    this._name = multicastDnsServiceTypes.stringify(opts.type, opts.protocol || 'tcp') + TLD$1;
    if (opts.name) this._name = opts.name + '.' + this._name;
    this._wildcard = false;
  }

  this.services = [];

  if (onup) this.on('up', onup);

  this.start();
}

Browser.prototype.start = function () {
  if (this._onresponse) return

  var self = this;

  // List of names for the browser to listen for. In a normal search this will
  // be the primary name stored on the browser. In case of a wildcard search
  // the names will be determined at runtime as responses come in.
  var nameMap = {};
  if (!this._wildcard) nameMap[this._name] = true;

  this._onresponse = function (packet, rinfo) {
    if (self._wildcard) {
      packet.answers.forEach(function (answer) {
        if (answer.type !== 'PTR' || answer.name !== self._name || answer.name in nameMap) return
        nameMap[answer.data] = true;
        self._mdns.query(answer.data, 'PTR');
      });
    }

    Object.keys(nameMap).forEach(function (name) {
      // unregister all services shutting down
      goodbyes(name, packet).forEach(self._removeService.bind(self));

      // register all new services
      var matches = buildServicesFor(name, packet, self._txt, rinfo);
      if (matches.length === 0) return

      matches.forEach(function (service) {
        if (self._serviceMap[service.fqdn]) return // ignore already registered services
        self._addService(service);
      });
    });
  };

  this._mdns.on('response', this._onresponse);
  this.update();
};

Browser.prototype.stop = function () {
  if (!this._onresponse) return

  this._mdns.removeListener('response', this._onresponse);
  this._onresponse = null;
};

Browser.prototype.update = function () {
  this._mdns.query(this._name, 'PTR');
};

Browser.prototype._addService = function (service) {
  this.services.push(service);
  this._serviceMap[service.fqdn] = true;
  this.emit('up', service);
};

Browser.prototype._removeService = function (fqdn) {
  var service, index;
  this.services.some(function (s, i) {
    if (dnsEqual(s.fqdn, fqdn)) {
      service = s;
      index = i;
      return true
    }
  });
  if (!service) return
  this.services.splice(index, 1);
  delete this._serviceMap[fqdn];
  this.emit('down', service);
};

// PTR records with a TTL of 0 is considered a "goodbye" announcement. I.e. a
// DNS response broadcasted when a service shuts down in order to let the
// network know that the service is no longer going to be available.
//
// For more info see:
// https://tools.ietf.org/html/rfc6762#section-8.4
//
// This function returns an array of all resource records considered a goodbye
// record
function goodbyes (name, packet) {
  return packet.answers.concat(packet.additionals)
    .filter(function (rr) {
      return rr.type === 'PTR' && rr.ttl === 0 && dnsEqual(rr.name, name)
    })
    .map(function (rr) {
      return rr.data
    })
}

function buildServicesFor (name, packet, txt, referer) {
  var records = packet.answers.concat(packet.additionals).filter(function (rr) {
    return rr.ttl > 0 // ignore goodbye messages
  });

  return records
    .filter(function (rr) {
      return rr.type === 'PTR' && dnsEqual(rr.name, name)
    })
    .map(function (ptr) {
      var service = {
        addresses: []
      };

      records
        .filter(function (rr) {
          return (rr.type === 'SRV' || rr.type === 'TXT') && dnsEqual(rr.name, ptr.data)
        })
        .forEach(function (rr) {
          if (rr.type === 'SRV') {
            var parts = rr.name.split('.');
            var name = parts[0];
            var types = multicastDnsServiceTypes.parse(parts.slice(1, -1).join('.'));
            service.name = name;
            service.fqdn = rr.name;
            service.host = rr.data.target;
            service.referer = referer;
            service.port = rr.data.port;
            service.type = types.name;
            service.protocol = types.protocol;
            service.subtypes = types.subtypes;
          } else if (rr.type === 'TXT') {
            service.rawTxt = rr.data;
            service.txt = txt.decode(rr.data);
          }
        });

      if (!service.name) return

      records
        .filter(function (rr) {
          return (rr.type === 'A' || rr.type === 'AAAA') && dnsEqual(rr.name, service.host)
        })
        .forEach(function (rr) {
          service.addresses.push(rr.data);
        });

      return service
    })
    .filter(function (rr) {
      return !!rr
    })
}
