const fs = require('fs');
const status = require('./status');
const netrc = require('netrc');
const { configs } = require('../configs/yp_configs');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
let ypRequest = require('../utils/yp_request');
let { normalize, denormalize, customMessage, invalidName } = require('../utils/yp_normalize');
const util = require('util');
const async = require('async');
const { customErrorConfig, customMessagesConfig } = require('../configs/yp_custom_error');
const nodeCmd = require('node-cmd');
const http = require('http');
const https = require('https');
const url = require('url');
const qs = require('qs');
const inquirer = require("inquirer");
const chalk = require('chalk');

module.exports = function(processingData, callback) {
    let executeLogic = {
        "endpointReference": "",
        "businessLogic": ""
    }
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
    let netrcObj = netrc();
    let workspacePath = "";
    let pathEndPoint = "";
    let apiNamePath = "";
    let pathYpSetting = "";
    let ypSettings = "";
    let businesslogicFile = "";
    let envRunList = ['remote', 'local'];
    let hostObj = configs().getHostDetails();
    if (netrcObj.hasOwnProperty(hostObj.host)) {
        loginUser = netrcObj[hostObj.host].login;
    } else {
        callback(customErrorConfig().customError.VALIDATION_ERROR_LOGINs);
    }
    if (!processingData.run) {
        processingData.run = 'local';
    }
    if (envRunList.indexOf(processingData.run) < 0) {
        return callback(customMessage(customErrorConfig().customError.RNERR));
    }
    if (processingData.run.toLowerCase() == 'local') {
        async.waterfall([
                function(callback) {
                    configs().getConfigSettings(function(err, data) {
                        if (err) {
                            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                            clearInterval(tickInterval);
                            ui.close();
                            callback(err);
                        } else {
                            workspacePath = JSON.parse(data).path;
                            apiNamePath = JSON.parse(data).path + normalize(processingData.apiName);
                            pathEndPoint = JSON.parse(data).path + normalize(processingData.apiName) + "/endpoints/";
                            pathYpSetting = JSON.parse(data).path + '.ypsettings.json';
                            businesslogicFile = pathEndPoint + normalize(processingData.endPointName) + ".js";
                            callback(null);
                        }
                    });
                },
                function(callback) {
                    fs.readFile(businesslogicFile, 'utf8', function(err, data) {
                        if (err) {
                            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                            clearInterval(tickInterval);
                            ui.close();
                            callback(customMessage(customErrorConfig().customError.APIEPERR));
                        } else {
                            businessLogic = data;
                            executeLogic.businessLogic = data;
                            setTimeout(function() {
                                ui.log.write(chalk.green('✓ Fetching the code ...'));
                                callback(null, executeLogic)
                            }, 1000);
                        }
                    });
                },
                function(executeLogic, callback) {
                    let errorCondition = false;
                    fs.readFile(pathYpSetting, 'utf8', function(err, data) {
                        if (err) {
                            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                            clearInterval(tickInterval);
                            ui.close();
                            callback(customMessage(customErrorConfig().customError.ENOENT));
                        } else {
                            ypSettings = JSON.parse(data);
                            let apiNameIndex = 0;
                            for (apiNameIndex = 0; apiNameIndex < ypSettings.apiReferences.length; apiNameIndex++) {
                                endpointIndex = 0;
                                if (ypSettings.apiReferences[apiNameIndex].apiName == processingData.apiName) {
                                    for (apiNameIndex = 0; apiNameIndex < ypSettings.apiReferences.length; apiNameIndex++) {
                                        if (ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].endpointName == processingData.endPointName) {
                                            executeLogic.endpointReference = ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].hash;
                                        }
                                        errorCondition = false;
                                    }
                                    break;
                                } else {
                                    errorCondition = true;
                                }
                            }
                            if (errorCondition) {
                                invalidName(workspacePath, function(err) {
                                    ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                                    clearInterval(tickInterval);
                                    ui.close();
                                    callback(err);
                                });
                            } else {
                                callback(null, executeLogic);
                            }
                        }
                    });
                },
                function(executeLogic, callback) {
                    let logic = "";
                    async.waterfall([
                        function(callback) {
                            let cmd = 'npm root -g';
                            let context = [];
                            let apiData = "";
                            ypSettings.apiReferences.forEach(function(apiRef) {
                                if (processingData.apiName == apiRef.apiName) {
                                    context = apiRef.remoteEndpoints;
                                    apiHash = apiRef.hash;
                                }
                            });
                            process.env.ypcontext = JSON.stringify({ ypsettings: context, apiHash: apiHash });
                            nodeCmd.get(cmd, function(err, nodeModulePath) {
                                if (err) {
                                    ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                                    clearInterval(tickInterval);
                                    ui.close();
                                    callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
                                } else {
                                    callback(null, nodeModulePath.trim());
                                }
                            });
                        },
                        function(nodeModulePath, callback) {
                            let remoteSetArray = JSON.parse(process.env.ypcontext);
                            remoteSetArray = remoteSetArray.ypsettings;
                            fs.readFile(__dirname + '/../template/logic_template.js', 'UTF-8', function(err, logicTemplateScript) {
                                if (err) {
                                    ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                                    clearInterval(tickInterval);
                                    ui.close();
                                    callback(err);
                                } else {
                                    logic = logicTemplateScript.replace("logicTemplate", executeLogic.businessLogic);
                                    logic = logic.replace("globalTemplate", nodeModulePath);
                                    let rpMysqlTemplates = [{ "dml": "execute", "syntax": " remoteObject.remoteResponse = await remoteObject.execute" },
                                        { "dml": "select", "syntax": " remoteObject.remoteResponse = await remoteObject.select" }
                                    ];
                                    let rpMongoTemplates = [{ "dml": "insert", "syntax": " remoteObject.remoteResponse = await remoteObject.insert" },
                                        { "dml": "update", "syntax": " remoteObject.remoteResponse = await remoteObject.update" },
                                        { "dml": "find", "syntax": " remoteObject.remoteResponse = await remoteObject.find" }
                                    ];
                                    let rpStoreTemplates = [{ "dml": "insert", "syntax": " remoteObject.remoteResponse = await remoteObject.insert" },
                                        { "dml": "update", "syntax": " remoteObject.remoteResponse = await remoteObject.update" },
                                        { "dml": "query", "syntax": " remoteObject.remoteResponse = await remoteObject.query" }
                                    ];
                                    let rpWebserviceTemplates = [{ "dml": "wsget", "syntax": " remoteObject.remoteResponse = await remoteObject.wsget" },
                                        { "dml": "wspost", "syntax": " remoteObject.remoteResponse = await remoteObject.wspost" },
                                        { "dml": "wsput", "syntax": " remoteObject.remoteResponse = await remoteObject.wsput" },
                                        { "dml": "wsdelete", "syntax": " remoteObject.remoteResponse = await remoteObject.wsdelete" }
                                    ];
                                    let replaceSyntax = "";
                                    for (let rmcount = 0; rmcount < remoteSetArray.length; rmcount++) {
                                        if (remoteSetArray[rmcount].configValues.type == "mysql") {
                                            for (let syncount = 0; syncount < rpMysqlTemplates.length; syncount++) {
                                                replaceSyntax = rpMysqlTemplates[syncount].syntax;
                                                replaceSyntax = replaceSyntax.replace(new RegExp("remoteObject", "g"), remoteSetArray[rmcount].configValues.logicCodeName);
                                                logic = logic.replace(new RegExp(remoteSetArray[rmcount].configValues.logicCodeName + "." + rpMysqlTemplates[syncount].dml, "g"), replaceSyntax);
                                            }
                                        } else if (remoteSetArray[rmcount].configValues.type == "mongo") {
                                            for (let syncount = 0; syncount < rpMongoTemplates.length; syncount++) {
                                                replaceSyntax = rpMongoTemplates[syncount].syntax;
                                                replaceSyntax = replaceSyntax.replace(new RegExp("remoteObject", "g"), remoteSetArray[rmcount].configValues.logicCodeName);
                                                logic = logic.replace(new RegExp(remoteSetArray[rmcount].configValues.logicCodeName + "." + rpMongoTemplates[syncount].dml, "g"), replaceSyntax);
                                            }
                                        } else if (remoteSetArray[rmcount].configValues.type == "store") {
                                            for (let syncount = 0; syncount < rpStoreTemplates.length; syncount++) {
                                                replaceSyntax = rpStoreTemplates[syncount].syntax;
                                                replaceSyntax = replaceSyntax.replace(new RegExp("remoteObject", "g"), remoteSetArray[rmcount].configValues.logicCodeName);
                                                logic = logic.replace(new RegExp(remoteSetArray[rmcount].configValues.logicCodeName + "." + rpStoreTemplates[syncount].dml, "g"), replaceSyntax);
                                            }
                                        } else if (remoteSetArray[rmcount].configValues.type == "webservice") {
                                            for (let syncount = 0; syncount < rpWebserviceTemplates.length; syncount++) {
                                                replaceSyntax = rpWebserviceTemplates[syncount].syntax;
                                                replaceSyntax = replaceSyntax.replace(new RegExp("remoteObject", "g"), remoteSetArray[rmcount].configValues.logicCodeName);
                                                logic = logic.replace(new RegExp(remoteSetArray[rmcount].configValues.logicCodeName + "." + rpWebserviceTemplates[syncount].dml, "g"), replaceSyntax);
                                            }
                                        }
                                    }
                                    callback(null, logic);
                                }
                            });
                        },
                        function(logic, callback) {
                            let tempFile = apiNamePath + '/temp.js';
                            fs.writeFile(tempFile, logic, function(err) {
                                if (err) {
                                    ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                                    clearInterval(tickInterval);
                                    ui.close();
                                    callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
                                } else {
                                    callback(null, tempFile);
                                }
                            });
                        },
                        function(file, callback) {
                            let commandOptions = resolveOSCommands();
                            let cmd = 'node ' + file;
                            nodeCmd.get(cmd, function(err, data) {
                                if (err) {
                                    ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                                    clearInterval(tickInterval);
                                    ui.close();
                                    callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
                                } else {
                                    setTimeout(function() {
                                        ui.log.write(chalk.green('✓ Running the Local Code'));
                                        callback(null, file, data);
                                    }, 1000);
                                }
                            });
                        },
                        function(file, response, callback) {
                            delete process.env.ypcontext;
                            fs.unlink(file, function(err) {
                                if (err) {
                                    ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                                    clearInterval(tickInterval);
                                    ui.close();
                                    callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
                                } else {
                                    callback(null, response);
                                }
                            });
                        }
                    ], function(err, result) {
                        if (err) {
                            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                            clearInterval(tickInterval);
                            ui.close();
                            callback(err);
                        } else {
                            callback(null, result);
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
                        callback(null, result);
                        ui.updateBottomBar(chalk.green('✓ Execute command completed'));
                        ui.close();
                    }, 1000);
                }
            }
        );
    } else if (processingData.run.toLowerCase() == 'remote') {
        async.waterfall([
            function(callback) {
                fs.readFile(processingData.configFile, 'utf8', function(err, data) {
                    if (err) {
                        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                        clearInterval(tickInterval);
                        ui.close();
                        error_code = 3000;
                        if (err.errno == -2) {
                            callback(customMessage(customErrorConfig().customError.ENOENT));
                        } else if (err.code == 1) {
                            callback(customMessage(customErrorConfig().customError.EACCES));
                        } else {
                            callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
                        }
                    } else {
                        let yappesConfig = JSON.parse(data);
                        let environmentList = ['development', 'testing', 'production'];
                        if (!yappesConfig.yappesEnvironment) {
                            yappesConfig.yappesEnvironment = 'development';
                        }
                        if (environmentList.indexOf(yappesConfig.yappesEnvironment) > -1) {
                            processingData.yappesEnvironment = yappesConfig.yappesEnvironment;
                            processingData.yappesKey = yappesConfig.yappesKey;
                            processingData.body = yappesConfig.body;
                            processingData.queryparams = yappesConfig.queryParameters;
                            processingData.headers = yappesConfig.headers;
                            processingData.pathParameters = yappesConfig.pathParameters;
                            callback(null);
                        } else {
                            ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                            clearInterval(tickInterval);
                            ui.close();
                            callback(customMessage(customErrorConfig().customError.ENVERR));
                        }
                    }
                });
            },
            function(callback) {
                status(processingData, function(err, response) {
                    if (err) {
                        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                        clearInterval(tickInterval);
                        ui.close();
                        callback(err);
                    } else {
                        setTimeout(function() {
                            ui.log.write(chalk.green('✓ Checking the status of code '));
                            callback(null, response.statusResponse);
                        }, 1000);
                    }
                });
            },
            function(status, callback) {
                let localAhead = false; //local is ahead;
                let epExist = false; // wrong name passed
                status.data.forEach(function(epStatus) {
                    if (processingData.endPointName == epStatus.endpointName) {
                        epExist = true;
                        if (epStatus.remoteSync == 'yes') {
                            localAhead = false;
                        } else if (epStatus.remoteSync == 'no') {
                            localAhead = true;
                        } else {
                            localAhead = false;
                        }
                    }
                });
                if (epExist) {
                    if (localAhead) {
                        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                        clearInterval(tickInterval);
                        ui.close();
                        callback(customMessage(customErrorConfig().customError.CDAHEAD));
                    } else {
                        callback(null);
                    }
                } else {
                    ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                    clearInterval(tickInterval);
                    ui.close();
                    callback(customMessage(customErrorConfig().customError.EPNAMEERR));
                }

            },
            function(callback) {
                configs().getConfigSettings(function(err, data) {
                    if (err) {
                        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                        clearInterval(tickInterval);
                        ui.close();
                        callback(err);
                    } else {
                        let pathYpSetting = JSON.parse(data).path + '.ypsettings.json';
                        callback(null, pathYpSetting);
                    }
                });
            },
            function(pathYpSetting, callback) {
                fs.readFile(pathYpSetting, 'utf8', function(err, data) {
                    if (err) {
                        error_code = 3000;
                        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                        clearInterval(tickInterval);
                        ui.close();
                        if (err.errno == -2) {
                            callback(customMessage(customErrorConfig().customError.ENOENT));
                        } else if (err.code == 1) {
                            callback(customMessage(customErrorConfig().customError.EACCES));
                        } else {
                            callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
                        }
                    } else {
                        let ypSettings = JSON.parse(data);
                        let yappesEndpointConfig = {
                            url: "",
                            endPoint: "",
                            method: ""
                        };
                        ypSettings.apiReferences.forEach(function(apiRef) {
                            if (processingData.apiName == apiRef.apiName) {
                                yappesEndpointConfig.url = apiRef.yappesUrls;
                                apiRef.endPointReferences.forEach(function(endpoints) {

                                    if (processingData.endPointName.toLowerCase() == endpoints.endpointName.toLowerCase()) {
                                        yappesEndpointConfig.endPoint = endpoints.endPoint;
                                        yappesEndpointConfig.method = endpoints.method;
                                    }
                                });
                            }
                        });
                        callback(null, yappesEndpointConfig);
                    }
                });
            },
            function(yappesEndpointConfig, callback) {
                if (yappesEndpointConfig.endPoint.includes('{') || yappesEndpointConfig.endPoint.includes('}')) {
                    let endpointArr = yappesEndpointConfig.endPoint.split("/");
                    let pathParamsList = Object.keys(processingData.pathParameters);
                    let pathValuesList = Object.values(processingData.pathParameters);
                    let paramsLength = pathParamsList.length;
                    let keyCount = 0;
                    let tempArr = [];
                    endpointArr.forEach(function(el) {
                        if (el.includes('{')) {
                            el = el.replace(/[{}]/g, "");
                            tempArr.push(el);
                        }
                    });
                    pathParamsList.forEach(
                        function(endpointElements) {
                            if (endpointArr.indexOf('{' + endpointElements + '}') > -1) {
                                yappesEndpointConfig.endPoint = yappesEndpointConfig.endPoint.replace('{' + endpointElements + '}', pathValuesList[keyCount]);
                                keyCount++;
                            }
                        });
                    if (keyCount == tempArr.length) {
                        callback(null, yappesEndpointConfig);
                    } else {
                        setTimeout(function() {
                            ui.log.write(chalk.green('✓ passing the parameters'));
                            callback(customMessage(customErrorConfig().customError.PATHPRERR));
                        }, 1000);
                    }
                } else {
                    setTimeout(function() {
                        ui.log.write(chalk.green('✓ passing the parameters'));
                        callback(null, yappesEndpointConfig);
                    }, 1000);
                }

            },
            function(yappesEndpointConfig, callback) {
                let yappesBaseUrl = yappesEndpointConfig.url[processingData.yappesEnvironment];
                let yappesUrl = yappesBaseUrl + yappesEndpointConfig.endPoint;
                let parameters = {
                    method: yappesEndpointConfig.method,
                    headers: processingData.headers,
                    queryparams: processingData.queryparams,
                    payload: processingData.body
                };
                runLogic(yappesUrl, parameters, processingData.yappesKey, function(err, response) {
                    if (err) {
                        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
                        clearInterval(tickInterval);
                        ui.close();
                        callback(err);
                    } else {
                        setTimeout(function() {
                            ui.log.write(chalk.green('✓ Running the Remote Code'));
                            callback(response);
                        }, 1000);
                    }
                });
            }
        ], function(err, response) {
            if (err) {
                callback(err);
            } else {
                setTimeout(function() {
                    clearInterval(tickInterval);
                    ui.updateBottomBar('');
                    callback(null, response);
                    ui.updateBottomBar(chalk.green('✓ Executr command completed'));
                    ui.close();
                }, 1000);

            }
        });
    }
}


function runLogic(apiUrl, parameters, yappesKey, callback) {
    let self = this;
    let reqSchemeObj = https;
    let responseChunk = "";
    let methodList = ["get", "post", "put", "delete", "patch"];
    if (parameters.method) {
        if (parameters.method === parameters.method.toUpperCase()) {
            parameters.method = parameters.method.toLowerCase();
        } else {
            parameters.method = parameters.method.toLowerCase();
        }
        if (methodList.indexOf(parameters.method) == -1) {
            callback(customMessage(customErrorConfig().customError.METHODNTALLOWEDERR));
        }
    } else {
        callback(customMessage(customErrorConfig().customError.METHODNAERR));
    }


    let urlParts = url.parse(apiUrl);
    let options = {
        host: urlParts.hostname,
        path: urlParts.pathname,
        port: urlParts.port ? urlParts.port : 98,
        method: parameters.method,
        headers: parameters.headers
    };
    if (options.method != "get") {
        if (Object.keys(parameters.payload).length <= 0) {
            return callback(customMessage(customErrorConfig().customError.PAYLOADERR));
        }
    }
    options.headers["X-YAPPES-KEY"] = yappesKey;
    if (!options.port) {
        options.port = 443;
    }
    if (Object.keys(parameters.queryparams).length > 0) {
        options.path += "?" + qs.stringify(parameters.queryparams, {
            encode: false
        });
    }

    if (!urlParts.protocol.match(/https+/)) {
        reqSchemeObj = http;
    } else {
        reqSchemeObj = https;
    }
    let requestObj = reqSchemeObj.request(options, function(response) {
        response.on('data', function(chunk) {
            responseChunk += chunk;
        });
        response.on('end', function() {
            callback(null, responseChunk);
        });
    });
    requestObj.write(JSON.stringify(parameters.payload));
    requestObj.on('error', function(err) {
        ui.updateBottomBar(chalk.bgRedBright('✗ Failed...'));
        clearInterval(tickInterval);
        ui.close();
        callback(err);
    });

    requestObj.end();
}