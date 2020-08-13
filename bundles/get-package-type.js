import 'path';
import util from 'util';
import fs from 'fs';

const {promisify} = util;
const readFile = promisify(fs.readFile);
