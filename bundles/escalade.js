import 'path';
import { stat, readdir } from 'fs';
import { promisify } from 'util';

const toStats = promisify(stat);
const toRead = promisify(readdir);
