import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import 'os';

// Growl - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)

/**
 * Module dependencies.
 */

const spawn = child_process.spawn;




const exists = fs.existsSync || path.existsSync;
