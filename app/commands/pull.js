const fs = require('fs');
const netrc = require('netrc');
const { configs } = require('../configs/yp_configs');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
let ypRequest = require('../utils/yp_request');
let { normalize } = require('../utils/yp_normalize');
const util = require('util');
const async = require('async');
const { customErrorConfig } = require('../configs/yp_custom_error');
const ora = require('ora');
let pathEndPoint = "";
let pathYpSetting = "";
let ypSettings = "";
let endPointFile = "";
let responseDataPull = "";
const spinner = ora('Loading unicorns').start();


module.exports = function(processingData, callback) {
    let cliPullData = {
        "apiName": "",
        "endpointDetails": []
    }
    endPointsBulkArray = [];
    async.waterfall([
            function(callback) {
                if (processingData.endPointName == undefined) {
                    configs().getConfigSettings(function(err, data) {
                        if (err) {
                            callback(err);
                        } else {
                            pathEndPoint = JSON.parse(data).path + normalize(processingData.apiName) + "/endpoints/";
                            pathYpSetting = JSON.parse(data).path + '.ypsettings.json';
                            callback(null);
                        }
                    });
                } else {
                    configs().getConfigSettings(function(err, data) {
                        if (err) {
                            callback(err);
                        } else {
                            pathEndPoint = JSON.parse(data).path + normalize(processingData.apiName) + "/endpoints/";
                            pathYpSetting = JSON.parse(data).path + '.ypsettings.json';
                            endPointFile = pathEndPoint + normalize(processingData.endPointName) + ".js";
                            callback(null);
                        }
                    });
                }
            },
            function(callback) {
                if (processingData.endPointName == undefined) {
                    fs.readdir(pathEndPoint, function(err, files) {
                        if (err) {
                            callback(err);
                        } else {
                            endPointsBulkArray = files;
                            callback(null);
                        }
                    });
                } else {
                    fs.stat(endPointFile, function(err, stats) {
                        if (err) {
                            callback(err);
                        } else {
                            let mtime = new Date(util.inspect(stats.mtime));
                            cliPullData.apiName = processingData.apiName;
                            cliPullData.endpointDetails.push({ "endpointName": processingData.endPointName, "lastModifiedDateTime": mtime });
                            callback(null)
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
                                callback('Wrong Endpoint Details');
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
                        callback(err);
                    } else {
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
                if (true) {
                    let epIndex = 0;
                    let syncResponse = "";
                    if (responseDataPull.data.endpointPullList.length >= 1) {
                        async.whilst(function() {
                            return epIndex < responseDataPull.data.endpointPullList.length;
                        }, function(callback) {
                            if (responseDataPull.data.endpointPullList[epIndex].remoteSync == 'yes') {
                                syncResponse += "'" + responseDataPull.data.endpointPullList[epIndex].endpointName + "'" + " Remote code was ahead of your Local code repo. Syncing is done. Now both the Local and Remote repo are in-sync.\n";
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
                                syncResponse += "'" + responseDataPull.data.endpointPullList[epIndex].endpointName + "'" + " Local is having the latest Code. Once you have done with your update use 'yappescli deploy' command to push it to Remote.\n";
                                epIndex++;
                                callback(null);
                            } else if (responseDataPull.data.endpointPullList[epIndex].remoteSync == 'in-sync') {
                                syncResponse += "'" + responseDataPull.data.endpointPullList[epIndex].endpointName + "'" + " Local and Remote are already in-sync. \n";
                                epIndex++;
                                callback(null,);
                            }
                        }, function(err) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, syncResponse);
                            }
                        });
                    }

                } else {
                    if (responseDataPull.data.endpointPullList[0].remoteSync == 'no' || responseDataPull.data.endpointPullList[0].remoteSync == 'in-sync') {
                        callback(null, 'Alredy have the latest one');
                    } else {
                        fs.writeFile(endPointFile, decodeURI(responseDataPull.data.endpointPullList[0].businesslogic), new Date(responseDataPull.data.endpointPullList[0].remoteModifiedDateTime), function(err) {
                            if (err) {
                                callback(err)
                            } else {
                                fs.utimesSync(endPointFile, new Date(responseDataPull.data.endpointPullList[0].remoteModifiedDateTime), new Date(responseDataPull.data.endpointPullList[0].remoteModifiedDateTime));
                                callback(null, 'Updated Business Logic Successfully');
                            }
                        });
                    }
                }
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

function writeFile(path, remoteData, remoteModTime, callback) {
    fs.writeFile(path, decodeURI(remoteData), function(err) {
        if (err) {
            callback(err)
        } else {
            fs.utimesSync(path, remoteModTime, remoteModTime);
            callback(null);
        }
    });
}