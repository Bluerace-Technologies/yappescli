const fs = require('fs');
const netrc = require('netrc');
const { configs } = require('../configs/yp_configs');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
let ypRequest = require('../utils/yp_request');
let { normalize } = require('../utils/yp_normalize');
const util = require('util');
const async = require('async');
const { customErrorConfig, customMessagesConfig } = require('../configs/yp_custom_error');
const inquirer = require("inquirer");
const chalk = require('chalk');

module.exports = function(processingData, callback) {
    let cliPullData = {
        "apiName": "",
        "endpointDetails": []
    }
    endPointsBulkArray = [];
    let pathEndPoint = "";
    let pathYpSetting = "";
    let ypSettings = "";
    let endPointFile = "";
    let responseDataPull = "";
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

    let netrcObj = netrc();
    let loginUser = "";

    async.waterfall([
            function(callback) {
                let hostObj = configs().getHostDetails();
                if (netrcObj.hasOwnProperty(hostObj.host)) {
                    loginUser = netrcObj[hostObj.host].login;
                    callback(null);
                } else {
                    // callback(customMessage(customErrorConfig().customError.VALIDATION_ERROR_LOGIN));
                    ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                    clearInterval(tickInterval);
                    ui.close();
                    callback(customErrorConfig().customError.VALIDATION_ERROR_LOGIN);
                }
            },
            function(callback) {
                if (processingData.endPointName == undefined) {
                    configs().getConfigSettings(function(err, data) {
                        if (err) {
                            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                            clearInterval(tickInterval);
                            ui.close();
                            callback(err);
                        } else {
                            pathEndPoint = JSON.parse(data).path + normalize(processingData.apiName) + "/endpoints/";
                            pathYpSetting = JSON.parse(data).path + '.ypsettings.json';
                            ui.log.write(chalk.green('✓ Execution starts....'));
                            callback(null);
                        }
                    });
                } else {
                    configs().getConfigSettings(function(err, data) {
                        if (err) {
                            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                            clearInterval(tickInterval);
                            ui.close();
                            callback(err);
                        } else {
                            pathEndPoint = JSON.parse(data).path + normalize(processingData.apiName) + "/endpoints/";
                            pathYpSetting = JSON.parse(data).path + '.ypsettings.json';
                            endPointFile = pathEndPoint + normalize(processingData.endPointName) + ".js";
                            ui.log.write(chalk.green('✓ Execution starts....'));
                            callback(null);
                        }
                    });
                }
            },
            function(callback) {
                if (processingData.endPointName == undefined) {
                    fs.readdir(pathEndPoint, function(err, files) {
                        if (err) {
                            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                            clearInterval(tickInterval);
                            ui.close();
                            callback(customErrorConfig().customError.INVALID_APINAME.errorMessage); // change
                        } else {
                            endPointsBulkArray = files;
                            setTimeout(function() {
                                ui.log.write(chalk.green('✓ Collecting api and its endpoint details.'));
                                callback(null);
                            }, 1000);
                        }
                    });
                } else {
                    fs.stat(endPointFile, function(err, stats) {
                        if (err) {
                            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                            clearInterval(tickInterval);
                            ui.close();
                            callback(customErrorConfig().customError.INVALID_APINAME.errorMessage); // change
                        } else {
                            let mtime = new Date(util.inspect(stats.mtime));
                            cliPullData.apiName = processingData.apiName;
                            cliPullData.endpointDetails.push({ "endpointName": processingData.endPointName, "lastModifiedDateTime": mtime });
                            setTimeout(function() {
                                callback(null);
                                ui.log.write(chalk.green('✓ Collecting api and its endpoint details.'));
                            }, 1000);
                        }
                    });
                }
            },
            function(callback) {
                let errorCondition = false;
                fs.readFile(pathYpSetting, 'utf8', function(err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        let fileNumber = 0;
                        ypSettings = JSON.parse(data);
                        if (processingData.endPointName == undefined) {
                            cliPullData.apiName = processingData.apiName;
                            async.whilst(function() {
                                    return fileNumber < endPointsBulkArray.length;
                                },
                                function(callback) {
                                    fs.stat(pathEndPoint + endPointsBulkArray[fileNumber], function(err, stats) {
                                        if (err) {
                                            callback(err);
                                        } else {
                                            var mtime = new Date(util.inspect(stats.mtime));
                                            let hashArr = [];
                                            for (let apiNameIndex = 0; apiNameIndex < ypSettings.apiReferences.length; apiNameIndex++) {
                                                if (ypSettings.apiReferences[apiNameIndex].apiName == processingData.apiName) {
                                                    for (let epIndex = 0; epIndex < ypSettings.apiReferences[apiNameIndex].endPointReferences.length; epIndex++) {
                                                        hashArr.push(ypSettings.apiReferences[apiNameIndex].endPointReferences[epIndex].hash);
                                                    }
                                                }
                                            }
                                            endPointsBulkArray[fileNumber] = normalize(endPointsBulkArray[fileNumber]);
                                            let resourceDetails = { "endpointName": endPointsBulkArray[fileNumber], "lastModifiedDateTime": mtime, "hashReference": hashArr[fileNumber] };
                                            cliPullData.endpointDetails.push(resourceDetails);
                                            fileNumber++;
                                            callback(null);
                                        }
                                    });
                                },
                                function(err) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        callback(null, cliPullData);
                                    }
                                });
                        } else {
                            let apiNameIndex = 0;
                            for (apiNameIndex = 0; apiNameIndex < ypSettings.apiReferences.length; apiNameIndex++) {
                                endpointIndex = 0;
                                if (ypSettings.apiReferences[apiNameIndex].apiName == processingData.apiName) {
                                    for (endpointIndex = 0; ypSettings.apiReferences[apiNameIndex].endPointReferences.length > endpointIndex; endpointIndex++) {
                                        if (ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].endpointName == processingData.endPointName) {
                                            cliPullData.endpointDetails[0].hashReference = ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].hash;
                                        }
                                        errorCondition = false;
                                    }
                                    break;
                                } else {
                                    errorCondition = true;
                                }
                            }
                            if (errorCondition) {
                                callback(customErrorConfig().customError.INVALID_ENDPOINTNAME.errorMessage);
                            } else {
                                callback(null, cliPullData);
                            }
                        }
                    }
                });
            },
            function(cliPullData, callback) {
                let endPointPath = "/cli/endpoint/pull/"
                ypRequest.call(endPointPath, "post", cliPullData, function(err, statusResponse) {
                    if (err) {
                        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                        clearInterval(tickInterval);
                        ui.close();
                        callback(err);
                    } else {
                        setTimeout(function() {
                            ui.log.write(chalk.green('✓ Making pull request to remote.'));
                        }, 1000);
                        if (processingData.endPointName == undefined) {
                            if (statusResponse.code == 200) {
                                responseDataPull = statusResponse;
                                callback(null);
                            }
                        } else {
                            if (statusResponse.code == 200) {
                                responseDataPull = statusResponse;
                                callback(null);
                            } else if (statusResponse.code == 400) {
                                if (statusResponse.status == 'local-latest') {
                                    callback(statusResponse.data.message);
                                } else if (statusResponse.status == 'local-remote-already-sync') {
                                    callback(statusResponse.data.message);
                                } else {
                                    callback(statusResponse.message)
                                }
                            } else {
                                callback(statusResponse.data.message);
                            }
                        }
                    }
                });
            },
            function(callback) {
                let epIndex = 0;
                let syncResponse = "";
                if (responseDataPull.data.endpointPullList.length >= 1) {
                    async.whilst(function() {
                        return epIndex < responseDataPull.data.endpointPullList.length;
                    }, function(callback) {
                        if (responseDataPull.data.endpointPullList[epIndex].remoteSync == 'yes') {
                            syncResponse += "'" + responseDataPull.data.endpointPullList[epIndex].endpointName + "'" + customMessagesConfig().customMessages.PULL_BEHIND.message;
                            path = pathEndPoint + normalize(responseDataPull.data.endpointPullList[epIndex].endpointName) + '.js';
                            writeFile(path, decodeURI(responseDataPull.data.endpointPullList[epIndex].businesslogic), new Date(responseDataPull.data.endpointPullList[epIndex].remoteModifiedDateTime), function(err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    epIndex++;
                                    callback(null);
                                }
                            });
                        } else if (responseDataPull.data.endpointPullList[epIndex].remoteSync == 'no') {
                            syncResponse += "'" + responseDataPull.data.endpointPullList[epIndex].endpointName + "'" + customMessagesConfig().customMessages.PULL_FORWARD.message;
                            epIndex++;
                            callback(null);
                        } else if (responseDataPull.data.endpointPullList[epIndex].remoteSync == 'in-sync') {
                            syncResponse += "'" + responseDataPull.data.endpointPullList[epIndex].endpointName + "'" + customMessagesConfig().customMessages.PULL_INSYNC.message;
                            epIndex++;
                            callback(null);
                        }
                    }, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, syncResponse);
                        }
                    });
                }
            }
        ],
        function(error, result) {
            if (error) {
                ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                clearInterval(tickInterval);
                ui.close();
                callback(error);
            } else {
                setTimeout(function() {
                    clearInterval(tickInterval);
                    ui.updateBottomBar('');
                    callback(null,result);
                    ui.updateBottomBar(chalk.green('✓ Pull command execution completed'));
                    ui.close();
                }, 1000);
            }
        });
}

function writeFile(path, remoteData, remoteModTime, callback) {
    fs.writeFile(path, decodeURI(remoteData), function(err) {
        if (err) {
            callback(err);
        } else {
            fs.utimesSync(path, remoteModTime, remoteModTime);
            callback(null);
        }
    });
}