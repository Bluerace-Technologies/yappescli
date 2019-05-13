const netrc = require('netrc');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { configs } = require('../configs/yp_configs');
const { resolveOSCommands } = require('../utils/yp_resolve_os');
const { customErrorConfig } = require('../configs/yp_custom_error');
const { customMessage } = require('../utils/yp_normalize');

module.exports = function (processingData, callback) {
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

  const hostObj = configs().getHostDetails();
  const netrcObj = netrc();
  let loginUser = '';

  ui.log.write(chalk.magenta('Checking ....'));

  if (netrcObj.hasOwnProperty(hostObj.host)) {
    loginUser = netrcObj[hostObj.host].login;
    setTimeout(() => {
      clearInterval(tickInterval);
      ui.updateBottomBar('');
      ui.updateBottomBar(chalk.green('✓ You are Logged in. \n'));
      ui.close();
      callback(null, loginUser);
    }, 1000);
  } else {
    setTimeout(() => {
      clearInterval(tickInterval);
      ui.updateBottomBar('');
      ui.updateBottomBar(chalk.green('✓ Login Required. \n'));
      ui.close();
      callback(customMessage(customErrorConfig().customError.VALIDATION_ERROR_LOGIN));
    }, 1000);
  }
};
