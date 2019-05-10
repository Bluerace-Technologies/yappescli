const fs = require('fs');
const netrc = require('netrc');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { configs } = require('../configs/yp_configs');
const ypRequest = require('../utils/yp_request');
const { resolveOSCommands } = require('../utils/yp_resolve_os');


module.exports = function (processingData, callback) {
  const fpath = configs().netrcPath;
  const hostObj = configs().getHostDetails();
  const netrcObj = netrc();
  const data = {
    emailId: processingData.username,
    password: processingData.password,
  };

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

  ypRequest.cliLogin(processingData.endPointPath, 'post', data, (err, apiResponse) => {
    ui.log.write(chalk.green('✓ Execution starts....'));
    if (err) {
      ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
      clearInterval(tickInterval);
      ui.close();
      callback(err);
    } else {
      netrcObj[hostObj.host] = {
        login: processingData.username,
        password: apiResponse.data.ypToken,
      };
      netrc.save(netrcObj);
      setTimeout(() => {
        clearInterval(tickInterval);
        ui.updateBottomBar('');
        ui.updateBottomBar(chalk.green('✓ Login completed. \n'));
        ui.close();
        callback(null, 'Successfully authenticated!!');
      }, 1000);
    }
  });
};
