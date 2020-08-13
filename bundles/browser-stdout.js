import stream from 'stream';
import util from 'util';

var WritableStream = stream.Writable;
var inherits = util.inherits;


inherits(BrowserStdout, WritableStream);

function BrowserStdout(opts) {
  if (!(this instanceof BrowserStdout)) return new BrowserStdout(opts)

  opts = opts || {};
  WritableStream.call(this, opts);
  this.label = (opts.label !== undefined) ? opts.label : 'stdout';
}

BrowserStdout.prototype._write = function(chunks, encoding, cb) {
  var output = chunks.toString ? chunks.toString() : chunks;
  if (this.label === false) {
    console.log(output);
  } else {
    console.log(this.label+':', output);
  }
  process.nextTick(cb);
};
