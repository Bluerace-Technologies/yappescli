const fs = require('fs');
const netrc = require('netrc');
const { configs } = require('../configs/yp_configs');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
let ypRequest = require('../utils/yp_request');
const util = require('util');
const async = require('async');

module.exports = function(processingData, callback) {
    let apiDetails = { "apiName": processingData.apiName, "endpointDetails": [] };
    let path = configs().yappesWorkspace + processingData.apiName + "/endpoints/";
    async.waterfall([
        function(callback) {
            fs.readdir(path, (err, files) => {
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
                            callback(err);
                        } else {
                            var mtime = new Date(util.inspect(stats.mtime));
                            let resourceDetails = { "endpointName": listFile[fileNumber], "lastModifiedDateTime": mtime };
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
                    if (statusResponse.data[epIndex].remoteSync == 'Yes') {
                        syncResponse += statusResponse.data[epIndex].endpointName + " Remote code is ahead of your local machine.Use the command 'yappescli pull' to sync with your local code. \n";
                        epIndex++;
                    } else if (statusResponse.data[epIndex].remoteSync == 'No') {
                        syncResponse += statusResponse.data[epIndex].endpointName + " Local code is ahead of remote server.Use the command 'yappescli push' to sync with remote code. \n";
                        epIndex++;
                    } else {
                        syncResponse += statusResponse.data[epIndex].endpointName;
                        epIndex++;
                    }
                    callback(null);
                }, function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, syncResponse);
                    }
                });
            } else { callback(statusResponse); }

        }
    ], function(err, res) {
        if (err) {
            if (err.errno == -2) {
                fs.readdir(configs().yappesWorkspace, (err, files) => {
                    if (err) {
                        let errMsg="'ypworkspace' does not exist ";
                        callback(errMsg);
                    } else {
                        let errMsg = "The API Name you provided is incorrect. Please select from the list provided below\n " + files;
                        callback(null, errMsg);
                    }
                });
            } else {
                callback(err);
            }
        } else {
            callback(null, res);
        }
    });
}