function BaseError() {}
BaseError.prototype = new Error();
BaseError.prototype.toString = function() {
  return this.message
};
