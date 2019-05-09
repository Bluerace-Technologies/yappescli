const fs = require('fs');
const { configs } = require('../configs/yp_configs');
let ypRequest = require('../utils/yp_request');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
var async = require('async');
const netrc = require('netrc');
const nodeCmd = require('node-cmd');
let { normalize, customMessage, invalidName } = require('../utils/yp_normalize');
let path = require("path");
let settingFileName = ".ypsettings.json";
const { customErrorConfig, customMessagesConfig } = require('../configs/yp_custom_error');
const inquirer = require("inquirer");
const chalk = require('chalk');

module.exports = function(processingData, callback) {
    let commandOptions = resolveOSCommands();
    let netrcObj = netrc();
    let loginUser = "";
    let apiHashDetails = {};
    let configFileExists = false;
    let workspace = "";
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
    let hostObj = configs().getHostDetails();
    if (netrcObj.hasOwnProperty(hostObj.host)) {
        loginUser = netrcObj[hostObj.host].login;
    } else {
        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
        clearInterval(tickInterval);
        ui.close();
        return callback(customMessage(customErrorConfig().customError.VALIDATION_ERROR_LOGIN));
    }
    async.waterfall([
        function(callback) {
            configs().getConfigSettings(function(err, data) {
                if (err) {
                    if (err.errno == -2) {
                        let path = process.env.HOME + '/.config/yappes/settings.json';
                        createWsPath(path, function(err, workspacePath) {
                            if (err) {
                                callback(err);
                            } else {
                                workspace = workspacePath;
                                callback(null);
                            }
                        });
                    } else {
                        callback(err);
                    }
                } else {
                    workspace = JSON.parse(data).path;
                    callback(null);
                }
            });
        },
        function(callback) {
            if (fs.existsSync(workspace + settingFileName)) {
                configFileExists = true;
                callback(null);
            } else {
                callback(null);
            }
        },
        function(callback) {
            delete processingData.endPointPath;
            let endPointPath = "/cli/clone/apidefinitions/" + loginUser;
            ypRequest.call(endPointPath, "post", processingData, function(err, apiResponse) {
                if (err) {
                    callback(err);
                } else {
                    if (apiResponse.code == 200) {
                        ui.log.write(chalk.green('✓ Fetching remote details....'));
                        apiHashDetails = apiResponse.data;
                        callback(null, apiResponse);
                    } else {
                        if (apiResponse.message) {
                            callback(apiResponse.message);
                        } else {
                            callback(apiResponse.data.message);
                        }
                    }
                }
            });
        },
        function(apiResponse, callback) {
            let index = 0;
            let cmd = commandOptions['create-dir'] + ' -p ';
            let path = workspace + normalize(apiResponse.data.apiDetails.apiName) + '/endpoints';
            cmd += path;
            nodeCmd.get(cmd, function(err, data) {
                if (err) {
                    callback(err);
                } else {
                    async.whilst(function() { return index < apiResponse.data.endpointDetails.length; },
                        function(callback) {
                            let touchCmd = commandOptions['create-file'] + " " + path + '/' + normalize(apiResponse.data.endpointDetails[index].endPointName) + '.js';
                            nodeCmd.get(touchCmd, function(err, data) {
                                if (err) {
                                    callback(err);
                                } else {
                                    fs.writeFile(path + '/' + normalize(apiResponse.data.endpointDetails[index].endPointName) + '.js', apiResponse.data.endpointDetails[index].businessLogic, function(err) {
                                        if (err) {
                                            callback(err);
                                        } else {
                                            fs.utimesSync(path + '/' + normalize(apiResponse.data.endpointDetails[index].endPointName) + '.js', new Date(apiResponse.data.endpointDetails[index].modifiedDateTime), new Date(apiResponse.data.endpointDetails[index].modifiedDateTime));
                                            index++;
                                            callback(null);
                                        }
                                    });
                                }
                            });
                        },
                        function(err) {
                            if (err) {
                                callback(err);
                            } else {
                                setTimeout(function() {
                                    ui.log.write(chalk.green('✓ Summoning Files ....'));
                                    callback(null, customMessagesConfig().customMessages.CLSUCCESS.message + " " + processingData.apiIdentifier);
                                }, 1000);

                            }
                        });
                }
            });
        },
        function(res, callback) {
            if (!configFileExists) {
                createSettingsFile(apiHashDetails, workspace, function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        setTimeout(function() {
                            ui.log.write(chalk.green('✓ Creating Settings file  ....'));
                            callback(null, res);
                        }, 1000);

                    }
                });
            } else {
                appendSettingsFile(apiHashDetails, workspace, function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        setTimeout(function() {
                            ui.log.write(chalk.green('✓ Updating Settings Files ....'));
                            callback(null, res);
                        }, 1000);
                    }
                });
            }
        },
        function(result, callback) {
            createYpClasses(workspace, apiHashDetails, function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        function(result, callback) {
            let configFilePath = workspace + '/' + normalize(apiHashDetails.apiDetails.apiName) + '/test/runtime_config.json';
            createRuntimeConfig(apiHashDetails, configFilePath, function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        }
    ], function(err, res) {
        if (err) {
            clearInterval(tickInterval);
            ui.close();
            error_code = 3000;
            if (err.errno == -2) {
                callback(customMessage(customErrorConfig().customError.ELIBBAD));
            } else if (err.code == 1) {
                callback(customMessage(customErrorConfig().customError.EACCES));
            } else {
                callback(customMessage(customErrorConfig().customError.APNAMEERR));
            }
        } else {
            setTimeout(function() {
                clearInterval(tickInterval);
                ui.updateBottomBar('');
                ui.updateBottomBar(chalk.green('✓ Clone command execution completed \n'));
                ui.close();
                callback(null, res);
            }, 1000);
        }
    });
}

function createSettingsFile(apiHashDetails, workspace, callback) {
    let path = workspace;
    let commandOptions = resolveOSCommands();
    let touchCmd = commandOptions['create-file'] + " " + path + settingFileName;
    nodeCmd.get(touchCmd, function(err, data) {
        if (err) {
            callback(err);
        } else {
            let settingsData = {
                cloneReference: 'clr',
                apiReferences: [{
                    apiName: apiHashDetails.apiDetails.apiName,
                    hash: apiHashDetails.apiDetails.hash,
                    yappesUrls: apiHashDetails.apiDetails.urls,
                    remoteEndpoints: apiHashDetails.apiDetails.remoteEndpoints,
                    endPointReferences: []
                }]
            };
            for (var i = 0; i < apiHashDetails.endpointDetails.length; i++) {
                let endPointTempVar = {
                    endpointName: apiHashDetails.endpointDetails[i].endPointName,
                    hash: apiHashDetails.endpointDetails[i].hash,
                    endPoint: apiHashDetails.endpointDetails[i].endPoint,
                    method: apiHashDetails.endpointDetails[i].method
                };
                settingsData.apiReferences[0].endPointReferences.push(endPointTempVar);
            }
            fs.writeFile(path + settingFileName, JSON.stringify(settingsData, null, 4), function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
        }
    });
}

function appendSettingsFile(apiHashDetails, workspace, callback) {
    let path = workspace;
    async.waterfall([
        function(callback) {
            let commandOptions = resolveOSCommands();
            fs.readFile(path + settingFileName, 'utf8', function(err, data) {
                if (err) {
                    callback(err);
                } else {
                    let content = JSON.stringify(data);
                    data = JSON.parse(JSON.parse(content));
                    callback(null, data);
                }
            });
        },
        function(fileData, callback) {
            let epIndex = 0;
            let newApiClone = false;
            let settingsData = {
                apiReferences: {
                    apiName: apiHashDetails.apiDetails.apiName,
                    hash: apiHashDetails.apiDetails.hash,
                    yappesUrls: apiHashDetails.apiDetails.urls,
                    remoteEndpoints: apiHashDetails.apiDetails.remoteEndpoints,
                    endPointReferences: []
                }
            };
            let apiCount = 0;
            for (var i = 0; i < apiHashDetails.endpointDetails.length; i++) {
                let endPointTempVar = {
                    endpointName: apiHashDetails.endpointDetails[i].endPointName,
                    hash: apiHashDetails.endpointDetails[i].hash,
                    endPoint: apiHashDetails.endpointDetails[i].endPoint,
                    method: apiHashDetails.endpointDetails[i].method
                };
                settingsData.apiReferences.endPointReferences.push(endPointTempVar);
            }
            async.whilst(function() {
                return epIndex < fileData.apiReferences.length;
            }, function(callback) {
                if (apiHashDetails.apiDetails.hash == fileData.apiReferences[epIndex].hash) {
                    fileData.apiReferences[epIndex] = settingsData.apiReferences;
                } else {
                    apiCount++;
                }
                if (apiCount == fileData.apiReferences.length) {
                    newApiClone = true;
                }
                epIndex++;
                callback(null);
            }, function(err) {
                if (err) {
                    callback(err);
                } else {
                    if (newApiClone) {
                        fileData.apiReferences.push(settingsData.apiReferences);
                    }
                    callback(null, fileData);
                }
            });
        },
        function(fileData, callback) {
            fs.writeFile(path + settingFileName, JSON.stringify(fileData, null, 4), function(err) {
                if (err) { callback(err) } else {
                    callback(null);
                }
            });
        },
    ], function(err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null);
        }
    });
}

function fetchWorkspacePath(path, callback) {
    fs.readFile(path, 'utf8', function(err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, data);
        }
    });
}

function createWsPath(path, callback) {
    let commandOptions = resolveOSCommands();
    let workspacePath = {
        "path": process.cwd() + '/ypworkspace/'
    };
    let configPath = process.env.HOME + "/.config/yappes";
    let cmd = commandOptions['create-dir'] + " -p " + configPath;
    nodeCmd.get(cmd, function(err, data) {
        if (err) {
            callback(err);
        } else {
            fs.writeFile(path, JSON.stringify(workspacePath), function(err) {
                if (err) {
                    callback(err)
                } else {
                    callback(null, workspacePath.path);
                }
            });
        }
    });

}

function createYpClasses(workspace, apiHashDetails, callback) {
    let path = workspace;
    let commandOptions = resolveOSCommands();
    let requestFile = 'yprequest.json';
    let responseFile = 'ypresponse.json';
    let touchCmd = commandOptions['create-dir'] + ' -p ' + path + '/' + normalize(apiHashDetails.apiDetails.apiName) + '/test';
    nodeCmd.get(touchCmd, function(err, data) {
        if (err) {
            callback(err);
        } else {
            async.waterfall([function(callback) {
                fs.readFile(__dirname + '/../tests/reqresdata.js', 'UTF-8', function(err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        let content = JSON.stringify(data);
                        callback(null, data);
                    }
                });
            }, function(fileData, callback) {
                let reqResObject = fileData;
                fs.writeFile(path + normalize(apiHashDetails.apiDetails.apiName) + '/test/' + 'executestub.js', reqResObject, function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
            }], function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
        }
    });
}

function createRuntimeConfig(apiHashDetails, path, callback) {
    let environmentDetails = {
        body: {},
        queryParameters: {},
        headers: {},
        pathParameters: {},
        yappesEnvironment: "",
        yappesKey: ""
    };
    fs.writeFile(path, JSON.stringify(environmentDetails, null, 4), function(err) {
        if (err) {
            callback(err)
        } else {
            callback(null);
        }
    });
}