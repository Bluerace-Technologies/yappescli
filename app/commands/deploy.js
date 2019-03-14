const fs = require('fs');
const netrc = require('netrc');
const { configs } = require('../configs/yp_configs');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
let ypRequest = require('../utils/yp_request');
let { normalize } = require('../utils/yp_normalize');
const util = require('util');
const async = require('async');
const { customErrorConfig } = require('../configs/yp_custom_error');


module.exports = function(processingData, callback) {
    let apiNameError = 'API Name is Invalid';
    let updateBusinessLogicData = {
        "endpointReference": "",
        "businessLogic": ""
    }
    let pathEndPoint = configs().yappesWorkspace + normalize(processingData.apiName) + "/endpoints/";
    let pathYpSetting = configs().yappesWorkspace + '.ypsettings.json';
    businesslogicFile = pathEndPoint + processingData.endPointName + ".js";
    let ypSettings = "";
    async.waterfall([
            function(callback) {
                fs.readFile(businesslogicFile, 'utf8', (err, data) => {
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
                        updateBusinessLogicData.businessLogic = data;
                        callback(null, updateBusinessLogicData)
                    }
                });
            },
            function(updateBusinessLogicData, callback) {
                let errorCondition = false;
                fs.readFile(pathYpSetting, 'utf8', function(err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        ypSettings = JSON.parse(data);
                        var apiNameIndex = 0;
                        for (apiNameIndex = 0; apiNameIndex < ypSettings.apiReferences.length; apiNameIndex++) {
                            endpointIndex = 0;
                            if (ypSettings.apiReferences[apiNameIndex].apiName == processingData.apiName) {
                                for (apiNameIndex = 0; apiNameIndex < ypSettings.apiReferences.length; apiNameIndex++) {
                                    if (ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].endpointName == processingData.endPointName) {
                                        updateBusinessLogicData.endpointReference = ypSettings.apiReferences[apiNameIndex].endPointReferences[endpointIndex].hash;
                                    }
                                    errorCondition = false;
                                }break;
                            } else {
                                errorCondition = true;
                            }
                        }
                        if (errorCondition) {
                            callback(apiNameError);
                        } else {
                            callback(null, updateBusinessLogicData);
                        }
                    }
                });
            },
            function(updateBusinessLogicData, callback) {
                let endPointPath = "/cli/resource/businesslogic/" + processingData.apiName;
                ypRequest.call(endPointPath, "put", updateBusinessLogicData, function(err, statusResponse) {
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
            }
        ],
        function(error, result) {
            if (error) {
                callback(error);
            } else {
                callback(null, result.data.message);
            }
        }
    )
}