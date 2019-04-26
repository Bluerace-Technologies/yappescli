const fs = require('fs');
const netrc = require('netrc');
const {configs} = require('../configs/yp_configs');
let {resolveOSCommands} = require('../utils/yp_resolve_os');
const inquirer = require("inquirer");
const chalk = require('chalk');

module.exports = function(processingData, callback){
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

    let hostObj=configs().getHostDetails();
    let fpath = configs().netrcPath;
    let netrcObj = netrc();
    let loginUser = "";
    let commandOptions = resolveOSCommands();

    ui.log.write(chalk.magenta('Checking ....'));
    
    if(netrcObj.hasOwnProperty(hostObj.host)){
    	loginUser = netrcObj[hostObj.host].login;
        setTimeout(function() {
                clearInterval(tickInterval);
                ui.updateBottomBar('');
                ui.updateBottomBar(chalk.green('✓ You are Logged in. \n'));
                ui.close();         
                callback(null, loginUser);
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