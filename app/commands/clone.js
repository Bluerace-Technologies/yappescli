const fs = require('fs');
const { configs } = require('../configs/yp_configs');
let ypRequest = require('../utils/yp_request');
let { resolveOSCommands } = require('../utils/yp_resolve_os');
var async = require('async');
const nodeCmd = require('node-cmd');

module.exports = function(processingData, callback) {
    let commandOptions = resolveOSCommands();
    // <currentDirectory>/<ypworkspace>/<apiNameDir>/<endpointsDir>/<endpointNameFile>.js
    async.waterfall([
        function(callback) {
            // let endPointUri = configs().hostDetails.scheme + "://" + configs().hostDetails.host + ":" + configs().hostDetails.port;
            // endPointUri += processingData.endPointPath;
            // ypRequest.call(endPointUri, "post", data, function(err, apiResponse) {
            //     if (err) {
            //         callback(err);
            //     } else {
            //         callback(null, apiResponse);
            //     }
            // });
            callback(null, processingData);
        },
        function(apiResponse, callback) {
            let index = 0;
            // echo "Hello you!" >> myfile.txt
            async.whilst(
                function() { return index < apiResponse.data.endpointDetails.length; },
                function(callback) {
                    let cmd = commandOptions['create-dir']+ ' -p ';
                    let path = 'ypworkspace' + apiResponse.data.apiDetails.apiName + '/' + apiResponse.data.endpointDetails[index].endPointName
                    cmd += path;
                    console.log(cmd);
                    nodeCmd.get(cmd, function(err, data) {
                        if (err) {
                            callback(err);
                        } else {
                            let touchCmd = commandOptions['create-file'] + path + '/' + apiResponse.data.endpointDetails[index].endPointName + '.js';
                            nodeCmd.get(touchCmd, function(err, data) {
                                console.log(touchCmd);
                                if (err) {
                                    callback(err);
                                } else {
                                    let insertCmd = 'echo ' + apiResponse.data.endpointDetails[index].businessLogic + ' >> ' + path + '/' + apiResponse.data.endpointDetails[index].endPointName + '.js';
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
                        callback(null, "Success");
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