const fs = require('fs');
const netrc = require('netrc');
const { configs } = require('../configs/yp_configs');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
let { normalize, denormalize, customMessage, invalidName } = require('../utils/yp_normalize');
let ypRequest = require('../utils/yp_request');
const util = require('util');
const async = require('async');
const { customErrorConfig, customMessagesConfig } = require('../configs/yp_custom_error');

module.exports = function(processingData, callback) {
    let apiDetails = { "apiName": processingData.apiName, "endpointDetails": [] };
    let path = "";
    let workspacePath = "";
    let workspaceFileJson = {};
    let netrcObj = netrc();
    let hostObj = configs().getHostDetails();
    if (netrcObj.hasOwnProperty(hostObj.host)) {
        loginUser = netrcObj[hostObj.host].login;
    } else {
        return callback("You are not logged in. Please login using the command 'yappescli login'");
    }
    async.waterfall([
        function(callback) {
            configs().getConfigSettings(function(err, data) {
                if (err) {
                    callback(err);
                } else {
                    workspacePath = JSON.parse(data).path
                    path = workspacePath + normalize(processingData.apiName) + "/endpoints/";
                    callback(null);
                }
            });
        },
        function(callback) {
            fs.readFile(workspacePath + "/.ypsettings.json", 'utf8', function(err, data) {
                if (err) {
                    error_code = 3000;
                    if (err.errno == -2) {
                        callback(customMessage(customErrorConfig().customError.ENOENT));
                    } else if (err.code == 1) {
                        callback(customMessage(customErrorConfig().customError.EACCES));
                    } else {
                        callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
                    }
                } else {
                    workspaceFileJson = JSON.parse(data);
                    callback(null)
                }
            });
        },
        function(callback) {
            fs.readdir(path, function(err, files) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, files);
                }
            });
        },
        function(listFile, callback) {
            let fileNumber = 0;
            async.whilst(function() {
                    return fileNumber < listFile.length;
                },
                function(callback) {
                    fs.stat(path + listFile[fileNumber], function(err, stats) {
                        if (err) {
                            callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
                        } else {
                            var mtime = new Date(util.inspect(stats.mtime));
                            let hashArr = [];
                            for (let apiNameIndex = 0; apiNameIndex < workspaceFileJson.apiReferences.length; apiNameIndex++) {
                                if (workspaceFileJson.apiReferences[apiNameIndex].apiName == processingData.apiName) {
                                    for (let epIndex = 0; epIndex < workspaceFileJson.apiReferences[apiNameIndex].endPointReferences.length; epIndex++) {
                                        hashArr.push(workspaceFileJson.apiReferences[apiNameIndex].endPointReferences[epIndex].hash);
                                    }
                                }
                            }
                            hashArr = hashArr.reverse();
                            let resourceDetails = { "endpointName": listFile[fileNumber], "lastModifiedDateTime": mtime, "hashReference": hashArr[fileNumber] };
                            apiDetails.endpointDetails.push(resourceDetails);
                            fileNumber++;
                            callback(null);
                        }
                    });
                },
                function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, apiDetails);
                    }
                });
        },
        function(apiDetails, callback) {
            let endPointPath = "/cli/endpoint/status/";
            ypRequest.call(endPointPath, "post", apiDetails, function(err, statusResponse) {
                if (err) {
                    callback(err);
                } else {
                    if (statusResponse.code == 200) {
                        callback(null, statusResponse);
                    } else {
                        callback(statusResponse.data.message);
                    }
                }
            });
        },
        function(statusResponse, callback) {
            let epIndex = 0;
            let syncResponse = "";
            if (statusResponse.data.length) {
                async.whilst(function() {
                    return epIndex < statusResponse.data.length;
                }, function(callback) {
                    if (statusResponse.data[epIndex].remoteSync == 'yes') {
                        syncResponse += "'" + statusResponse.data[epIndex].endpointName + "'" + customMessagesConfig().customMessages.RMCODEAHEAD.message;
                        epIndex++;
                    } else if (statusResponse.data[epIndex].remoteSync == 'no') {
                        syncResponse += "'" + statusResponse.data[epIndex].endpointName + "'" + customMessagesConfig().customMessages.LCCODEAHEAD.message;
                        epIndex++;
                    } else {
                        syncResponse += statusResponse.data[epIndex].endpointName;
                        epIndex++;
                    }
                    callback(null);
                }, function(err) {
                    if (err) {
                        callback(customMessage(customErrorConfig().customError.EOPNOTSUPP));
                    } else {
                        let status = {};
                        status.syncResponse = syncResponse;
                        status.statusResponse = statusResponse;
                        callback(null, status);
                    }
                });
            } else { callback(statusResponse); }

        }
    ], function(err, res) {
        if (err) {
            if (err.errno == -2) {
                invalidName(workspacePath, function(err) {
                    callback(err);
                });
            } else {
                callback(err);
            }
        } else {
            callback(null, res);
        }
    });
}