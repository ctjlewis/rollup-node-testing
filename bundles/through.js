import stream from 'stream';

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

var through_1 = createCommonjsModule(function (module, exports) {
// through
//
// a stream that does nothing but re-emit the input.
// useful for aggregating a series of changing but not ending streams into one stream)

exports = module.exports = through;
through.through = through;

//create a readable writable stream.

function through (write, end, opts) {
  write = write || function (data) { this.queue(data); };
  end = end || function () { this.queue(null); };

  var ended = false, destroyed = false, buffer = [], _ended = false;
  var stream$1 = new stream();
  stream$1.readable = stream$1.writable = true;
  stream$1.paused = false;

//  stream.autoPause   = !(opts && opts.autoPause   === false)
  stream$1.autoDestroy = !(opts && opts.autoDestroy === false);

  stream$1.write = function (data) {
    write.call(this, data);
    return !stream$1.paused
  };

  function drain() {
    while(buffer.length && !stream$1.paused) {
      var data = buffer.shift();
      if(null === data)
        return stream$1.emit('end')
      else
        stream$1.emit('data', data);
    }
  }

  stream$1.queue = stream$1.push = function (data) {
//    console.error(ended)
    if(_ended) return stream$1
    if(data === null) _ended = true;
    buffer.push(data);
    drain();
    return stream$1
  };

  //this will be registered as the first 'end' listener
  //must call destroy next tick, to make sure we're after any
  //stream piped from here.
  //this is only a problem if end is not emitted synchronously.
  //a nicer way to do this is to make sure this is the last listener for 'end'

  stream$1.on('end', function () {
    stream$1.readable = false;
    if(!stream$1.writable && stream$1.autoDestroy)
      process.nextTick(function () {
        stream$1.destroy();
      });
  });

  function _end () {
    stream$1.writable = false;
    end.call(stream$1);
    if(!stream$1.readable && stream$1.autoDestroy)
      stream$1.destroy();
  }

  stream$1.end = function (data) {
    if(ended) return
    ended = true;
    if(arguments.length) stream$1.write(data);
    _end(); // will emit or queue
    return stream$1
  };

  stream$1.destroy = function () {
    if(destroyed) return
    destroyed = true;
    ended = true;
    buffer.length = 0;
    stream$1.writable = stream$1.readable = false;
    stream$1.emit('close');
    return stream$1
  };

  stream$1.pause = function () {
    if(stream$1.paused) return
    stream$1.paused = true;
    return stream$1
  };

  stream$1.resume = function () {
    if(stream$1.paused) {
      stream$1.paused = false;
      stream$1.emit('resume');
    }
    drain();
    //may have become paused again,
    //as drain emits 'data'.
    if(!stream$1.paused)
      stream$1.emit('drain');
    return stream$1
  };
  return stream$1
}
});
