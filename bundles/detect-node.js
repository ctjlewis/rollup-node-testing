// Only Node.JS has a process variable that is of [[Class]] process
var detectNode = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';