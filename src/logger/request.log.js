const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, '../log');

// ensure log directory exists
(function checkForLogDir() {
  return fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
}());

// create access to output it to a file
const accessLogStream = fs.createWriteStream(path.join(logDirectory, '/access.log'), { flags: 'a' });
const requestLogger = morgan('short', { stream: accessLogStream });

module.exports = requestLogger;
