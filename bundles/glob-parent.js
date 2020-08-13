import path from 'path';
import os from 'os';

var pathPosixDirname = path.posix.dirname;
var isWin32 = os.platform() === 'win32';
