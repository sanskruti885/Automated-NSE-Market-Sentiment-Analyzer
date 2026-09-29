// logger.ts

import fs from 'fs';
import util from 'util';

const logStream = fs.createWriteStream('scraper.log', { flags: 'a' });
const errorStream = fs.createWriteStream('scraper-error.log', { flags: 'a' });

const logStdout = process.stdout;
const logStderr = process.stderr;

// Override console.log
console.log = function (...args: any[]): void {
  const message = util.format(...args) + '\n';
  logStream.write(message);
  logStdout.write(message);
};

// Override console.error
console.error = function (...args: any[]): void {
  const message = '[ERROR] ' + util.format(...args) + '\n';
  errorStream.write(message);
  logStderr.write(message);
};

export {}; // empty export to ensure treated as a module
