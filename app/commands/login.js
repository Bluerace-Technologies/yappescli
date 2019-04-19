const fs = require('fs');
const netrc = require('netrc');
const { configs } = require('../configs/yp_configs');
let ypRequest = require('../utils/yp_request');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
const inquirer = require("inquirer");
const chalk = require('chalk');

module.exports = function(processingData, callback) {
    let fpath = configs().netrcPath;
    let hostObj = configs().getHostDetails();
    let netrcObj = netrc();
    let data = {
        emailId: processingData.username,
        password: processingData.password
    };

    let clock = [
        "⠋",
        "⠙",
        "⠹",
        "⠸",
        "⠼",
        "⠴",
        "⠦",
        "⠧",
        "⠇",
        "⠏"
    ];

    let counter = 0;
    let ui = new inquirer.ui.BottomBar();

    let tickInterval = setInterval(() => {
        ui.updateBottomBar(chalk.yellowBright(clock[counter++ % clock.length]));
    }, 250);

    ypRequest.cliLogin(processingData.endPointPath, "post", data, function(err, apiResponse) {
        ui.log.write(chalk.green('✓ Execution starts....'));
        if (err) {
            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
            clearInterval(tickInterval);
            ui.close();
            callback(err);
        } else {
            netrcObj[hostObj.host] = {
                login: processingData.username,
                password: apiResponse.data.ypToken
            };
            netrc.save(netrcObj);
            setTimeout(function() {
                clearInterval(tickInterval);
                ui.updateBottomBar('');
                ui.updateBottomBar(chalk.green('✓ Login completed. \n'));
                ui.close();
                callback(null, "Successfully authenticated!!");
            }, 1000)
        }
    });
}