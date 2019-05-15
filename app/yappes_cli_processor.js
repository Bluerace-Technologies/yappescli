/* eslint global-require: "off" */
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { customMessage } = require('./utils/yp_normalize');
const { customErrorConfig } = require('./configs/yp_custom_error');
const { configs } = require('./configs/yp_configs');

const logDir = `${process.env.HOME||process.env.USERPROFILE}${configs().getDelimiter()}${configs().configBase}/logs`;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const local = moment().format('YYYY-MM-DD HH:mm:ss');

const accessTransport = new transports.DailyRotateFile({
  filename: path.join(logDir, '%DATE%-access.log'),
  datePattern: 'DD-MM-YYYY',
  maxSize: '1m',
});
const errorTransport = new transports.DailyRotateFile({
  filename: path.join(logDir, '%DATE%-error.log'),
  datePattern: 'DD-MM-YYYY',
  maxSize: '1m',
});
const accessLogger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.printf(info => `${local},[${info.level}],${JSON.stringify(info.message)};`),
  ),
  transports: [accessTransport],
});

const errorLogger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.printf(info => `${info.timestamp};[${info.level}];${JSON.stringify(info.message)}`),
  ),
  transports: [errorTransport],
});


function YappesCliProcessor() {
  this.apiPath = {
    login() {
      return '/token/auth/cli';
    },
  };
  this.resolvePath = './commands/';
}


YappesCliProcessor.prototype.loadCommand = function (command) {
  const self = this;
  try {
    require.resolve(self.resolvePath + command);
    return require(self.resolvePath + command);
  } catch (e) {
    console.log(e);
    return false;
  }
};

YappesCliProcessor.prototype.executeCommand = function (command, inputData, callback) {
  const self = this;
  const clock = [
    '⠋',
    '⠙',
    '⠹',
    '⠸',
    '⠼',
    '⠴',
    '⠦',
    '⠧',
    '⠇',
    '⠏',
  ];

  let counter = 0;
  const ui = new inquirer.ui.BottomBar();

  const tickInterval = setInterval(() => {
    ui.updateBottomBar(chalk.yellowBright(clock[counter++ % clock.length]));
  }, 250);
  const commandModule = self.loadCommand(command);
  if (typeof commandModule === 'function') {
    if (self.apiPath[command]) {
      inputData.endPointPath = self.apiPath[command]();
    } else {
      inputData.endPointPath = 'not-required';
    }
    try {
      commandModule(inputData, (err, apiResults) => {
        if (err) {
          const logObject = {
            command,
            inputData,
            status: 'error',
            errorMessage: err,
          };
          errorLogger.error(logObject);
          ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
          clearInterval(tickInterval);
          ui.close();
          callback(err);
        } else {
          const logObject = {
            command,
            inputData,
            status: 'success',
          };
          accessLogger.info(logObject);
          clearInterval(tickInterval);
          ui.close();
          callback(null, apiResults);
        }
      });
    } catch (err) {
      const error = customErrorConfig().customError.RUNTIMEERR;
      error.errorMessage = err;
      ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
      clearInterval(tickInterval);
      ui.close();
      callback(customMessage(error));
    }
  } else {
    const logObject = {
      command,
      inputData,
      status: 'error',
      errorMessage: 'Invalid Command',
    };
    errorLogger.error(logObject);
    ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
    clearInterval(tickInterval);
    ui.close();
    callback('Invalid Command');
  }
};

module.exports = YappesCliProcessor;
