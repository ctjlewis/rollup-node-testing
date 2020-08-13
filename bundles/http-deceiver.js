import 'assert';
import 'util';
import buffer from 'buffer';

var Buffer = buffer.Buffer;

// Node.js version
var mode = /^v0\.8\./.test(process.version) ? 'rusty' :
           /^v0\.(9|10)\./.test(process.version) ? 'old' :
           /^v0\.12\./.test(process.version) ? 'normal' :
           'modern';

var HTTPParser;

var methods;
var reverseMethods;

var kOnHeaders;
var kOnHeadersComplete;
var kOnMessageComplete;
var kOnBody;
if (mode === 'normal' || mode === 'modern') {
  HTTPParser = process.binding('http_parser').HTTPParser;
  methods = HTTPParser.methods;

  // v6
  if (!methods)
    methods = process.binding('http_parser').methods;

  reverseMethods = {};

  methods.forEach(function(method, index) {
    reverseMethods[method] = index;
  });

  kOnHeaders = HTTPParser.kOnHeaders | 0;
  kOnHeadersComplete = HTTPParser.kOnHeadersComplete | 0;
  kOnMessageComplete = HTTPParser.kOnMessageComplete | 0;
  kOnBody = HTTPParser.kOnBody | 0;
} else {
  kOnHeaders = 'onHeaders';
  kOnHeadersComplete = 'onHeadersComplete';
  kOnMessageComplete = 'onMessageComplete';
  kOnBody = 'onBody';
}
