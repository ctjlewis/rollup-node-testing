import stream from 'stream';
import util from 'util';

var Writable = stream.Writable;
var inherits = util.inherits;

function Sink() {
  Writable.call(this, {
    objectMode: true
  });
}

inherits(Sink, Writable);

Sink.prototype._write = function(chunk, encoding, cb) {
  setImmediate(cb);
};
