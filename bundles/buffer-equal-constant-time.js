import buffer from 'buffer';

var Buffer = buffer.Buffer; // browserify
var SlowBuffer = buffer.SlowBuffer;

var origBufEqual = Buffer.prototype.equal;
var origSlowBufEqual = SlowBuffer.prototype.equal;
