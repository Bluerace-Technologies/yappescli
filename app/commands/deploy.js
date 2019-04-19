const fs = require('fs');
const netrc = require('netrc');
const { configs } = require('../configs/yp_configs');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
let ypRequest = require('../utils/yp_request');
let { normalize } = require('../utils/yp_normalize');
const util = require('util');
const async = require('async');
const { customErrorConfig } = require('../configs/yp_custom_error');
const inquirer = require("inquirer");
const chalk = require('chalk');


module.exports = function(processingData, callback) {
    let apiNameError = 'API Name is Invalid';
    let updateBusinessLogicData = {
        "endpointReference": "",
        "businessLogic": "",
        "lastModifiedDateTime": ""
    }
    let pathEndPoint = "";
    let pathYpSetting = "";
    let ypSettings = "";
    let businesslogicFile = "";
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


    async.waterfall([
            function(callback) {
                configs().getConfigSettings(function(err, data) {
                    if (err) {
                        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                        clearInterval(tickInterval);
                        ui.close();
                        callback(err);
                    } else {
                        pathEndPoint = JSON.parse(data).path + normalize(processingData.apiName) + "/endpoints/";
                        pathYpSetting = JSON.parse(data).path + '.ypsettings.json';
                        businesslogicFile = pathEndPoint + normalize(processingData.endPointName) + ".js";
                        ui.log.write(chalk.green('✓ Execution starts....'));
                        callback(null);
                    }
                });
            },
            function(callback) {
                fs.stat(businesslogicFile, function(err, stats) {
                    if (err) {
                        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                        clearInterval(tickInterval);
                        ui.close();
                        callback(err);
                    } else {
                        let mtime = new Date(util.inspect(stats.mtime));
                        updateBusinessLogicData.lastModifiedDateTime = mtime;
                        callback(null);
                    }
                });
            },
            function(callback) {
                fs.readFile(businesslogicFile, 'utf8', function(err, data) {
                    if (err) {
                        error_code = 3000;
                            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                            clearInterval(tickInterval);
                            ui.close();
                        if (err.errno == -2) {    
                            callback(customErrorConfig().customError.ENOENT);
                        } else if (err.code == 1) {
                            callback(customErrorConfig().customError.EACCES);
                        } else {
                            callback(customErrorConfig().customError.EOPNOTSUPP);
                        }
                    } else {
                        setTimeout(function() {
                            ui.log.write(chalk.green('✓ Checking the apiname and endpointname...'));
                            businessLogic = data;
                            updateBusinessLogicData.businessLogic = data;
                            callback(null, updateBusinessLogicData)
                        }, 1000);
                    }
                });
            },
            function(updateBusinessLogicData, callback) {
                let errorCondition = false;
                fs.readFile(pathYpSetting, 'utf8', function(err, data) {
                    if (err) {
                        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                        clearInterval(tickInterval);
                        ui.close();
                        callback(err);
                    } else {
                        ypSettings = JSON.parse(data);
                        let apiNameIndex = 0;
                        for (apiNameIndex = 0; apiNameIndex < ypSettings.apiReferences.length; apiNameIndex++) {
                            endpointIndex = 0;
                            if (ypSettings.apiReferences[apiNameIndex].apiName == processingData.apiName) {
                                for (endpointIndex = 0; ypSettings.apiReferences[apiNameIndex].endPointReferences.length > endpointIndex; endpointIndex++) {
                                    if (ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].endpointName == processingData.endPointName) {
                                        updateBusinessLogicData.endpointReference = ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].hash;
                                    }
                                    errorCondition = false;
                                }
                                break;
                            } else {
                                errorCondition = true;
                            }
                        }
                        if (errorCondition) {
                            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                            clearInterval(tickInterval);
                            ui.close();
                            callback(apiNameError);
                        } else {
                            setTimeout(function() {
                                ui.log.write(chalk.green('✓ Getting the latest code from local...'));
                                callback(null, updateBusinessLogicData);
                            }, 1000);
                        }
                    }
                });
            },
            function(updateBusinessLogicData, callback) {
                let endPointPath = "/cli/resource/businesslogic/" + processingData.apiName;
                ypRequest.call(endPointPath, "put", updateBusinessLogicData, function(err, statusResponse) {
                    if (err) {
                        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                        clearInterval(tickInterval);
                        ui.close();
                        callback(err);
                    } else {
                        if (statusResponse.code == 200) {
                            setTimeout(function() {
                                ui.log.write(chalk.green('✓ Deploying the code base to remote...'));
                                callback(null, statusResponse);
                            }, 1000);
                        } else {
                            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                            clearInterval(tickInterval);
                            ui.close();
                            callback(statusResponse.data.message);
                        }
                    }
                });
            }
        ],
        function(error, result) {
            if (error) {
                callback(error);
            } else {
                setTimeout(function() {
                    clearInterval(tickInterval);
                    ui.updateBottomBar('');
                    callback(null, result.data.message);
                    ui.updateBottomBar(chalk.green('✓ Deploy command execution completed'));
                    ui.close();
                }, 1000);
            }
        }
    )
}