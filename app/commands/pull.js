const fs = require('fs');
const netrc = require('netrc');
const { configs } = require('../configs/yp_configs');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
let ypRequest = require('../utils/yp_request');
let { normalize } = require('../utils/yp_normalize');
const util = require('util');
const async = require('async');
const { customErrorConfig } = require('../configs/yp_custom_error');
let pathEndPoint = "";
let pathYpSetting = "";
let ypSettings = "";
let endPointFile = "";
let responseDataPull = "";


module.exports = function(processingData, callback) {
    let cliPullData = {
        "apiName": "",
        "endpointDetails": [{
            "endpointName": "",
            "lastModifiedDateTime": "",
            "hashReference": ""
        }]
    }
    async.waterfall([
            function(callback) {
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
            },
            function(callback) {
                fs.stat(endPointFile, function(err, stats) {
                    if (err) {
                        callback(err);
                    } else {
                        let mtime = new Date(util.inspect(stats.mtime));
                        cliPullData.apiName = processingData.apiName;
                        cliPullData.endpointDetails[0].endpointName = processingData.endPointName;
                        cliPullData.endpointDetails[0].lastModifiedDateTime = mtime;
                        callback(null)
                    }
                });
            },
            function(callback) {
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
                });
            },
            function(cliPullData, callback) {
                let endPointPath = "/cli/endpoint/pull/"
                ypRequest.call(endPointPath, "post", cliPullData, function(err, statusResponse) {
                    if (err) {
                        callback(err);
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
                });
            },
            function(callback) {
                fs.writeFile(endPointFile, decodeURI(responseDataPull.data[0].businessLogic), function(err) {
                    if (err) {
                        callback(err)
                    } else {
                        callback(null, 'Updated Business Logic Successfully');
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