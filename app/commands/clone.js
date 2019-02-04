const fs = require('fs');
const { configs } = require('../configs/yp_configs');
let ypRequest = require('../utils/yp_request');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
var async = require('async');
const netrc = require('netrc');
const nodeCmd = require('node-cmd');

module.exports = function(processingData, callback) {
    let commandOptions = resolveOSCommands();
    let netrcObj = netrc();
    let loginUser = "";
    if (netrcObj.hasOwnProperty(configs().hostDetails.host)) {
        loginUser = netrcObj[configs().hostDetails.host].login;
    } else {
        callback("You are not logged in. Please login using the command 'yappescli login'");
    }
    async.waterfall([
        function(callback) {
            delete processingData.endPointPath;
            let endPointPath = "/cli/clone/apidefinitions/" + loginUser;
            ypRequest.call(endPointPath, "post", processingData, function(err, apiResponse) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, apiResponse);
                }
            });
        },
        function(apiResponse, callback) {
            let index = 0;
            async.whilst(
                function() { return index < apiResponse.data.endpointDetails.length; },
                function(callback) {
                    let cmd = commandOptions['create-dir'] + ' -p ';
                    let path = 'ypworkspace/' + apiResponse.data.apiDetails.apiName + '/endpoints'; 
                    cmd += path;
                    nodeCmd.get(cmd, function(err, data) {
                        if (err) {
                            callback(err);
                        } else {
                            let touchCmd = commandOptions['create-file'] + " " + path + '/' + apiResponse.data.endpointDetails[index].endPointName + '.js';
                            nodeCmd.get(touchCmd, function(err, data) {
                                if (err) {
                                    callback(err);
                                } else {
                                    let insertCmd = commandOptions['insert-into-file'] + " " + JSON.stringify(apiResponse.data.endpointDetails[index].businessLogic) + ' >> ' + path + '/' + apiResponse.data.endpointDetails[index].endPointName + '.js';
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
                        }
                    });
                },
                function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, "Successfully Cloned the API " + processingData.apiIdentifier);
                    }
                }
            );
        },

    ], function(err, res) {
        if (err) {
            callback(err);
        } else {
            callback(null, res);
        }

    });
}