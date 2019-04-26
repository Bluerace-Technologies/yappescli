const fs = require('fs');
const netrc = require('netrc');
const {configs} = require('../configs/yp_configs');
let {resolveOSCommands} = require('../utils/yp_resolve_os');
const inquirer = require("inquirer");
const chalk = require('chalk');


module.exports = function(processingData, callback){
    let fpath = configs().netrcPath;
    let hostObj=configs().getHostDetails();
    let netrcObj = netrc();
    let loginUser = "";

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

    let tickInterval = setInterval(() =>{
      ui.updateBottomBar(chalk.yellowBright(clock[counter++ % clock.length]));
    }, 250);

    ui.log.write(chalk.green('✓ Execution starts....'));

    if(netrcObj.hasOwnProperty(hostObj.host)){
    	delete netrcObj[hostObj.host];
    	netrc.save(netrcObj);
        setTimeout(function() {
                clearInterval(tickInterval);
                ui.updateBottomBar('');
                ui.updateBottomBar(chalk.green('✓ You are Logging out Please Wait. \n'));
                ui.close();         
                callback(null, "Logout done!!");
            },1000)
    } else {
        setTimeout(function() {
                clearInterval(tickInterval);
                ui.updateBottomBar('');
                ui.updateBottomBar(chalk.green('✓ Login Required. \n'));
                ui.close();         
                callback(customErrorConfig().customError.VALIDATION_ERROR_LOGIN);
            },1000)
    }
}