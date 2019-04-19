const fs = require('fs');
const netrc = require('netrc');
const { configs } = require('../configs/yp_configs');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
let ypRequest = require('../utils/yp_request');
let { normalize } = require('../utils/yp_normalize');
const util = require('util');
const async = require('async');
const { customErrorConfig } = require('../configs/yp_custom_error');
const nodeCmd = require('node-cmd');

module.exports = function(processingData, callback) {
    let apiNameError = 'API Name is Invalid';
    let executeLogic = {
        "endpointReference": "",
        "businessLogic": ""
    }
    let netrcObj = netrc();
    let pathEndPoint = "";
    let apiNamePath = "";
    let pathYpSetting = "";
    let ypSettings = "";
    let businesslogicFile = "";
    let hostObj = configs().getHostDetails();
    if (netrcObj.hasOwnProperty(hostObj.host)) {
        loginUser = netrcObj[hostObj.host].login;
    } else {
        callback("You are not logged in. Please login using the command 'yappescli login'");
    }
    async.waterfall([
            function(callback) {
                configs().getConfigSettings(function(err, data) {
                    if (err) {
                        callback(err);
                    } else {
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
                        error_code = 3000;
                        if (err.errno == -2) {
                            callback(customErrorConfig().customError.ENOENT);
                        } else if (err.code == 1) {
                            callback(customErrorConfig().customError.EACCES);
                        } else {
                            callback(customErrorConfig().customError.EOPNOTSUPP);
                        }
                    } else {
                        businessLogic = data;
                        executeLogic.businessLogic = data;
                        callback(null, executeLogic)
                    }
                });
            },
            function(executeLogic, callback) {
                let errorCondition = false;
                fs.readFile(pathYpSetting, 'utf8', function(err, data) {
                    if (err) {
                        callback(err);
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
                            callback(apiNameError);
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
                                callback(err);
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
                                callback(err);
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
                                callback(err);
                            } else {
                                callback(null, file, data);
                            }
                        });
                    },
                    function(file, response, callback) {
                        delete process.env.ypcontext;
                        fs.unlink(file, function(err) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, response);
                            }
                        });
                    }
                ], function(err, result) {
                    if (err) {
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
                callback(null, result);
            }
        }
    )
}