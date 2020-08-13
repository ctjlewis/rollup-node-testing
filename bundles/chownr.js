import fs from 'fs';
import 'path';

/* istanbul ignore next */
const LCHOWN = fs.lchown ? 'lchown' : 'chown';
/* istanbul ignore next */
const LCHOWNSYNC = fs.lchownSync ? 'lchownSync' : 'chownSync';

/* istanbul ignore next */
const needEISDIRHandled = fs.lchown &&
  !process.version.match(/v1[1-9]+\./) &&
  !process.version.match(/v10\.[6-9]/);

// fs.readdir could only accept an options object as of node v6
const nodeVersion = process.version;
/* istanbul ignore next */
if (/^v4\./.test(nodeVersion))
  ;
