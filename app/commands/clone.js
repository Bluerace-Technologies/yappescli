const fs = require('fs');
const { configs } = require('../configs/yp_configs');
let ypRequest = require('../utils/yp_request');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
var async = require('async');
const netrc = require('netrc');
const nodeCmd = require('node-cmd');
let { normalize } = require('../utils/yp_normalize');

module.exports = function(processingData, callback) {
    let commandOptions = resolveOSCommands();
    let netrcObj = netrc();
    let loginUser = "";
    let apiHashDetails = {};
    let configFileExists = false;
    if (netrcObj.hasOwnProperty(configs().hostDetails.host)) {
        loginUser = netrcObj[configs().hostDetails.host].login;
    } else {
        callback("You are not logged in. Please login using the command 'yappescli login'");
    }
    async.waterfall([
        function(callback) {
            if (fs.existsSync(configs().yappesWorkspace + ".ypsettings.conf")) {
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
                        apiHashDetails = apiResponse.data;
                        callback(null, apiResponse);
                    } else {
                        callback(apiResponse.data.message);
                    }
                }
            });
        },
        function(apiResponse, callback) {
            let index = 0;
            let cmd = commandOptions['create-dir'] + ' -p ';
            let path = configs().yappesWorkspace + normalize(apiResponse.data.apiDetails.apiName) + '/endpoints';
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
                                    let insertCmd = commandOptions['insert-into-file'] + " " + JSON.stringify(apiResponse.data.endpointDetails[index].businessLogic) + ' > ' + path + '/' + normalize(apiResponse.data.endpointDetails[index].endPointName) + '.js';
                                    nodeCmd.get(insertCmd, function(err, data) {
                                        if (err) {
                                            callback(err);
                                        } else {
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
                                callback(null, "Successfully Cloned the API " + processingData.apiIdentifier);
                            }
                        });
                }
            });
        },
        function(res, callback) {
            if (!configFileExists) {
                createSettingsFile(apiHashDetails, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            } else {
                appendSettingsFile(apiHashDetails, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            }
        }
    ], function(err, res) {
        if (err) {
            if (err.errno == -2) {
                callback("files not found or changed");
            } else {
                callback(err);
            }
        } else {
            callback(null, res);
        }

    });
}

function createSettingsFile(apiHashDetails, callback) {
    let path = configs().yappesWorkspace;
    let commandOptions = resolveOSCommands();
    let touchCmd = commandOptions['create-file'] + " " + path + ".ypsettings.conf";
    nodeCmd.get(touchCmd, function(err, data) {
        if (err) {
            callback(err);
        } else {
            let settingsData = {
                "cloneReference": "",
                "apiReferences": [{
                    "<translated api_name>": "hashValue",
                    "endpointReferences": [{ "<translated_endpoint_name>": "hashValue" }]
                }]
            };
            let insertCmd = commandOptions['insert-into-file'] + " " + JSON.stringify(settingsData) + ' > ' + path + ".ypsettings.conf";
            nodeCmd.get(insertCmd, function(err, data) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, data);
                }
            });
        }
    });
}

function appendSettingsFile(apiHashDetails, callback) {
    async.waterfall([
        function(callback) {
            let path = configs().yappesWorkspace;
            let commandOptions = resolveOSCommands();
            fs.readFile(path + ".ypsettings.conf", 'utf8', function(err, data) {
                if (err) { callback(err); } else {
                    let content = JSON.stringify(data);
                    data = JSON.parse(content);
                    callback(null, data);
                }
            });
        },
        function(fileData, callback) {
            //check the length of the corresponding apis endpoint 
            //if changed then push to endpoint array
            callback(null, fileData);
        },
        function(fileData, callback) {
            // push the details to the arr then overwrite
            callback(null, fileData);
        },
    ], function(err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}