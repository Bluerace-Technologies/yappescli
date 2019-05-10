const fs = require('fs');
const netrc = require('netrc');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { configs } = require('../configs/yp_configs');
const { resolveOSCommands } = require('../utils/yp_resolve_os');
const { customErrorConfig, customMessagesConfig } = require('../configs/yp_custom_error');
const { normalize, customMessage } = require('../utils/yp_normalize');


module.exports = function (processingData, callback) {
  const fpath = configs().netrcPath;
  const hostObj = configs().getHostDetails();
  const netrcObj = netrc();
  const loginUser = '';

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

  ui.log.write(chalk.green('✓ Execution starts....'));

  if (netrcObj.hasOwnProperty(hostObj.host)) {
    	delete netrcObj[hostObj.host];
    	netrc.save(netrcObj);
    setTimeout(() => {
      clearInterval(tickInterval);
      ui.updateBottomBar('');
      ui.updateBottomBar(chalk.green('✓ You are Logging out Please Wait. \n'));
      ui.close();
      callback(null, 'Logout done!!');
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
