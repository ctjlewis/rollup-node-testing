import 'util';
import 'fs';
import 'path';

const platform = process.env.__TESTING_MKDIRP_PLATFORM__ || process.platform;

const version = process.env.__TESTING_MKDIRP_NODE_VERSION__ || process.version;
const versArr = version.replace(/^v/, '').split('.');
const hasNative = +versArr[0] > 10 || +versArr[0] === 10 && +versArr[1] >= 12;
