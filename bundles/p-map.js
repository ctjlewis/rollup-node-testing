import os from 'os';

const homeDir = typeof os.homedir === 'undefined' ? '' : os.homedir();
